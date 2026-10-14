package com.ffqpu.boxassist.accessibility

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import kotlin.math.roundToInt
import kotlin.random.Random

// خدمة إمكانية الوصول: تنفذ النقر التلقائي عبر dispatchGesture
// ملاحظة: تتطلب تفعيل الخدمة يدوياً من إعدادات النظام.
class ClickAccessibilityService : AccessibilityService() {

    private val handler = Handler(Looper.getMainLooper())
    private var running = false
    private var runnable: Runnable? = null

    var intervalMs: Long = 300
    var randomize: Boolean = true
    var targetPoints: List<Pair<Int, Int>> = listOf(540 to 1200)
    var multiPoints: Int = 1
    var onTick: (() -> Unit)? = null
    var clickCount = 0L
        private set

    override fun onServiceConnected() {
        instance = this
        super.onServiceConnected()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() { stopClicking() }

    // بدء النقر على الإحداثيات المحددة
    fun startClicking(
        points: List<Pair<Int, Int>>,
        interval: Long,
        random: Boolean,
        pointsCount: Int
    ) {
        targetPoints = points
        intervalMs = interval.coerceIn(50, 2000)
        randomize = random
        multiPoints = pointsCount.coerceIn(1, 3)
        clickCount = 0
        if (running) return
        running = true
        scheduleNext()
    }

    fun stopClicking() {
        running = false
        runnable?.let { handler.removeCallbacks(it) }
    }

    fun isClicking() = running

    private fun scheduleNext() {
        var delay = intervalMs
        if (randomize) {
            // عشوائية ±20% لمحاكاة البشر
            val jitter = (delay * 0.2).roundToInt()
            delay += Random.nextInt(-jitter, jitter + 1)
            delay = delay.coerceAtLeast(30)
        }
        runnable = Runnable {
            if (!running) return@Runnable
            doTap()
            scheduleNext()
        }
        handler.postDelayed(runnable!!, delay)
    }

    private fun doTap() {
        val pts = targetPoints.take(multiPoints.coerceAtMost(targetPoints.size))
        if (pts.isEmpty()) return
        val builder = GestureDescription.Builder()
        pts.forEach { (x, y) ->
            val p = Path().apply { moveTo(x.toFloat(), y.toFloat()) }
            // ضغطة 40ms ثم رفع — تحاكي اللمس الحقيقي
            builder.addStroke(GestureDescription.StrokeDescription(p, 0, 40))
        }
        dispatchGesture(builder.build(), object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                clickCount += pts.size
                onTick?.invoke()
            }
        }, null)
    }

    override fun onUnbind(intent: android.content.Intent?): Boolean {
        instance = null
        return super.onUnbind(intent)
    }

    companion object {
        var instance: ClickAccessibilityService? = null
            private set
        fun isEnabled(): Boolean = instance != null
    }
}
