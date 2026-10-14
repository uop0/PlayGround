package com.ffqpu.boxassist.service

import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.LayoutInflater
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.ffqpu.boxassist.BoxAssistApp
import com.ffqpu.boxassist.R
import com.ffqpu.boxassist.accessibility.ClickAccessibilityService
import com.ffqpu.boxassist.data.PrefsManager
import com.ffqpu.boxassist.data.StatsRepository
import com.ffqpu.boxassist.ui.home.MainActivity
import com.ffqpu.boxassist.util.Constants
import com.ffqpu.boxassist.util.VibratorHelper
import kotlin.math.abs

// خدمة أمامية تعرض الزر العائم فوق كل التطبيقات (بما فيها TikTok)
// وتتحكم ببدء/إيقاف النقر التلقائي.
class OverlayService : Service() {

    private lateinit var wm: WindowManager
    private var floatView: View? = null
    private lateinit var prefs: PrefsManager
    private lateinit var stats: StatsRepository
    private var params: WindowManager.LayoutParams? = null

    private var clicking = false
    private var sessionClicks = 0L
    private var sessionStart = 0L
    private var lastX = 0
    private var lastY = 0
    private var downX = 0f
    private var downY = 0f
    private var downTime = 0L
    private var isMoving = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        prefs = (application as BoxAssistApp).prefs
        stats = StatsRepository(this)
        wm = getSystemService(WINDOW_SERVICE) as WindowManager
        createChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(Constants.NOTIF_ID, buildNotif())
        if (intent?.action == "STOP") { stopAll(); stopSelf(); return START_NOT_STICKY }
        showOverlay()
        return START_STICKY
    }

    private fun buildNotif(): Notification {
        val pi = PendingIntent.getActivity(
            this, 0, Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        return NotificationCompat.Builder(this, Constants.CHANNEL_ID)
            .setContentTitle(getString(R.string.notif_title))
            .setContentText(getString(R.string.notif_text))
            .setSmallIcon(R.drawable.ic_f_neon)
            .setContentIntent(pi)
            .setOngoing(true)
            .build()
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            val ch = NotificationChannel(
                Constants.CHANNEL_ID, "Overlay", NotificationManager.IMPORTANCE_LOW
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
        }
    }

    @SuppressLint("ClickableViewAccessibility", "InflateParams")
    private fun showOverlay() {
        if (floatView != null) { applyStyle(); return }
        if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(this)) return

        floatView = LayoutInflater.from(this).inflate(R.layout.view_floating_button, null)
        val type = if (Build.VERSION.SDK_INT >= 26)
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        else @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            type,
            // لا يسرق التركيز — يبقى ظاهراً مع الكيبورد وفوق TikTok
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 100; y = 400
        }

        val btn = floatView!!.findViewById<View>(R.id.floatBtn)
        val menu = floatView!!.findViewById<View>(R.id.floatMenu)

        // سحب للإفلات في أي مكان + ضغطة للتشغيل + ضغطة مطولة للقائمة
        btn.setOnTouchListener { v, e ->
            when (e.action) {
                MotionEvent.ACTION_DOWN -> {
                    downX = e.rawX; downY = e.rawY; downTime = System.currentTimeMillis()
                    lastX = params!!.x; lastY = params!!.y; isMoving = false
                    v.animate().scaleX(0.9f).scaleY(0.9f).setDuration(80).start()
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (e.rawX - downX).toInt()
                    val dy = (e.rawY - downY).toInt()
                    if (abs(dx) > 8 || abs(dy) > 8) isMoving = true
                    params!!.x = lastX + dx; params!!.y = lastY + dy
                    wm.updateViewLayout(floatView, params)
                }
                MotionEvent.ACTION_UP -> {
                    v.animate().scaleX(1f).scaleY(1f).setDuration(120).start()
                    val held = System.currentTimeMillis() - downTime
                    if (!isMoving && held > 500) {
                        menu.visibility = if (menu.visibility == View.VISIBLE) View.GONE else View.VISIBLE
                    } else if (!isMoving) {
                        toggleClick()
                    }
                }
            }
            true
        }

        floatView!!.findViewById<View>(R.id.mSpeed).setOnClickListener {
            // تبديل سريع بين 150 / 300 / 600ms
            prefs.intervalMs = when (prefs.intervalMs) {
                150 -> 300; 300 -> 600; else -> 150
            }
            if (clicking) restartClick()
            menu.visibility = View.GONE
        }
        floatView!!.findViewById<View>(R.id.mHide).setOnClickListener {
            floatView?.visibility = View.GONE
            // إظهار مجدد عبر الإشعار — نبقي الخدمة تعمل
            menu.visibility = View.GONE
            floatView?.postDelayed({ floatView?.visibility = View.VISIBLE }, 5000)
        }
        floatView!!.findViewById<View>(R.id.mClose).setOnClickListener {
            stopAll(); stopSelf()
        }

        applyStyle()
        wm.addView(floatView, params)
    }

    private fun applyStyle() {
        val v = floatView?.findViewById<View>(R.id.floatBtn) ?: return
        v.scaleX = prefs.floatScale; v.scaleY = prefs.floatScale
        v.alpha = prefs.floatAlpha
        val bg = when (prefs.floatShape) {
            "square" -> R.drawable.bg_float_square
            "hand" -> R.drawable.bg_float_hand
            else -> R.drawable.bg_float_circle
        }
        v.setBackgroundResource(bg)
    }

    // موقع النقر = موقع الزر نفسه (أو نقطة ثابتة إن حددها المستخدم)
    private fun tapPoint(): List<Pair<Int, Int>> {
        if (prefs.fixedX >= 0 && prefs.fixedY >= 0)
            return listOf(prefs.fixedX to prefs.fixedY)
        val loc = IntArray(2)
        val btn = floatView?.findViewById<View>(R.id.floatBtn)
        btn?.getLocationOnScreen(loc)
        val cx = loc[0] + ((btn?.width ?: 120) / 2)
        val cy = loc[1] + ((btn?.height ?: 120) / 2)
        // Multi-touch: نقاط إضافية بإزاحة بسيطة
        return when (prefs.multiTouchPoints) {
            2 -> listOf(cx to cy, cx + 40 to cy)
            3 -> listOf(cx to cy, cx + 40 to cy, cx to cy + 40)
            else -> listOf(cx to cy)
        }
    }

    private fun toggleClick() {
        if (clicking) stopAll() else startClick()
    }

    private fun startClick() {
        val svc = ClickAccessibilityService.instance
        if (svc == null) {
            // وجّه المستخدم لتفعيل خدمة الوصول
            val i = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(i)
            return
        }
        clicking = true
        sessionClicks = 0; sessionStart = System.currentTimeMillis()
        floatView?.findViewById<View>(R.id.floatBtn)?.isSelected = true
        svc.onTick = {
            sessionClicks++
            stats.addClicks(1)
            if (prefs.vibrateOnClick) VibratorHelper.tick(this)
            val target = prefs.targetClicks
            if (target > 0 && sessionClicks >= target) stopAll()
        }
        svc.startClicking(tapPoint(), prefs.intervalMs.toLong(), prefs.randomPress, prefs.multiTouchPoints)
    }

    private fun restartClick() {
        ClickAccessibilityService.instance?.stopClicking()
        clicking = false
        startClick()
    }

    private fun stopAll() {
        clicking = false
        ClickAccessibilityService.instance?.stopClicking()
        if (sessionStart > 0) {
            val secs = (System.currentTimeMillis() - sessionStart) / 1000
            // finishSession تضيف النقرات مجدداً — نمرر 0 ونحسب المدة فقط عبر زيادة الجلسات
            // (النقرات تُحسب لحظياً في onTick). نستخدم انعكاساً بسيطاً:
            stats.finishSession(0, secs)
            sessionStart = 0
        }
        try { floatView?.let { wm.removeView(it) } } catch (_: Exception) {}
        floatView = null
    }

    override fun onDestroy() {
        ClickAccessibilityService.instance?.stopClicking()
        try { floatView?.let { wm.removeView(it) } } catch (_: Exception) {}
        super.onDestroy()
    }
}
