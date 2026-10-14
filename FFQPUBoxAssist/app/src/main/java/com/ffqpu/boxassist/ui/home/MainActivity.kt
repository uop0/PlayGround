package com.ffqpu.boxassist.ui.home

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.ffqpu.boxassist.BoxAssistApp
import com.ffqpu.boxassist.R
import com.ffqpu.boxassist.data.PrefsManager
import com.ffqpu.boxassist.databinding.ActivityMainBinding
import com.ffqpu.boxassist.service.OverlayService
import com.ffqpu.boxassist.ui.permissions.PermissionExplainActivity
import com.ffqpu.boxassist.ui.settings.SettingsActivity
import com.ffqpu.boxassist.ui.stats.StatsActivity
import com.ffqpu.boxassist.util.Constants
import com.ffqpu.boxassist.util.LocaleHelper
import com.ffqpu.boxassist.util.TikTokLinkValidator
import com.google.android.material.dialog.MaterialAlertDialogBuilder

// الشاشة الرئيسية: إدخال الرابط + السيرفر + الاتصال + تفعيل الأوفرلاي
class MainActivity : AppCompatActivity() {

    private lateinit var b: ActivityMainBinding
    private lateinit var prefs: PrefsManager
    private val vm: HomeViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = (application as BoxAssistApp).prefs
        b = ActivityMainBinding.inflate(layoutInflater)
        setContentView(b.root)

        showDisclaimerOnce()
        setupServerDropdown()
        restoreFields()
        observeVm()

        b.btnConnect.setOnClickListener { doConnect() }
        b.btnOverlay.setOnClickListener { requestOverlayFlow() }
        b.btnSettings.setOnClickListener { startActivity(Intent(this, SettingsActivity::class.java)) }
        b.btnStats.setOnClickListener { startActivity(Intent(this, StatsActivity::class.java)) }
        b.btnLang.setOnClickListener { toggleLang() }
    }

    // تحذير أول تشغيل: مخالفة شروط TikTok
    private fun showDisclaimerOnce() {
        if (prefs.disclaimerAccepted) return
        MaterialAlertDialogBuilder(this)
            .setTitle(getString(R.string.disclaimer_title))
            .setMessage(getString(R.string.disclaimer_text))
            .setCancelable(false)
            .setPositiveButton(getString(R.string.i_understand)) { d, _ ->
                prefs.disclaimerAccepted = true; d.dismiss()
            }
            .setNegativeButton(getString(R.string.exit)) { _, _ -> finish() }
            .show()
    }

    private fun setupServerDropdown() {
        val adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, Constants.SERVERS)
        b.serverDropdown.setAdapter(adapter)
        b.serverDropdown.setText(prefs.serverType, false)
        b.serverDropdown.setOnItemClickListener { _, _, pos, _ ->
            prefs.serverType = Constants.SERVERS[pos]
        }
    }

    private fun restoreFields() {
        b.etLink.setText(prefs.liveLink)
        b.etUser.setText(prefs.username.ifEmpty { "@FFQPU" })
    }

    private fun observeVm() {
        vm.status.observe(this) { online ->
            b.statusDot.setBackgroundResource(
                if (online) R.drawable.dot_online else R.drawable.dot_offline
            )
            b.tvStatus.text = if (online) getString(R.string.online) else getString(R.string.offline)
            // نبض وهمي
            b.statusDot.animate().scaleX(1.4f).scaleY(1.4f).setDuration(300)
                .withEndAction { b.statusDot.animate().scaleX(1f).scaleY(1f).setDuration(300).start() }
                .start()
        }
        vm.ping.observe(this) { b.tvPing.text = "Ping: $it" }
        vm.connecting.observe(this) { b.btnConnect.isEnabled = !it }
    }

    private fun doConnect() {
        val link = b.etLink.text.toString().trim()
        val user = b.etUser.text.toString().trim().ifEmpty { "@FFQPU" }
        if (!TikTokLinkValidator.isValid(link)) {
            b.tilLink.error = getString(R.string.invalid_link)
            return
        }
        b.tilLink.error = null
        prefs.liveLink = TikTokLinkValidator.normalize(link)
        prefs.username = user
        prefs.serverType = b.serverDropdown.text.toString().ifEmpty { "Auto" }
        vm.connect(prefs.liveLink, prefs.serverType)
        Toast.makeText(this, getString(R.string.connecting), Toast.LENGTH_SHORT).show()
    }

    private fun requestOverlayFlow() {
        // 1) شرح الأذونات أولاً
        if (!prefs.disclaimerAccepted) { showDisclaimerOnce(); return }
        // 2) إذن الظهور فوق التطبيقات
        if (Build.VERSION.SDK_INT >= 23 && !Settings.canDrawOverlays(this)) {
            startActivity(Intent(this, PermissionExplainActivity::class.java))
            return
        }
        startOverlay()
    }

    private fun startOverlay() {
        val i = Intent(this, OverlayService::class.java)
        if (Build.VERSION.SDK_INT >= 26) startForegroundService(i)
        else startService(i)
        Toast.makeText(this, getString(R.string.overlay_on), Toast.LENGTH_SHORT).show()
    }

    private fun toggleLang() {
        prefs.language = if (prefs.language == "ar") "en" else "ar"
        LocaleHelper.setLocale(this, prefs.language)
        recreate()
    }

    @Deprecated("legacy")
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == Constants.OVERLAY_REQ &&
            Build.VERSION.SDK_INT >= 23 && Settings.canDrawOverlays(this)
        ) startOverlay()
    }

    // فتح إعدادات الأوفرلاي يدوياً
    @Suppress("unused")
    private fun openOverlaySettings() {
        val i = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
        startActivityForResult(i, Constants.OVERLAY_REQ)
    }
}
