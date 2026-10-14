package com.ffqpu.boxassist.ui.permissions

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import androidx.appcompat.app.AppCompatActivity
import com.ffqpu.boxassist.databinding.ActivityPermissionsBinding

// شاشة شرح أنيقة قبل طلب كل إذن من إعدادات النظام
class PermissionExplainActivity : AppCompatActivity() {

    private lateinit var b: ActivityPermissionsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b = ActivityPermissionsBinding.inflate(layoutInflater)
        setContentView(b.root)

        b.btnOverlay.setOnClickListener {
            if (Build.VERSION.SDK_INT >= 23) {
                startActivity(
                    Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:$packageName")
                    )
                )
            }
        }
        b.btnAccess.setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        b.btnNotif.setOnClickListener {
            if (Build.VERSION.SDK_INT >= 26) {
                startActivity(Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
                })
            }
        }
        b.btnDone.setOnClickListener { finish() }
    }
}
