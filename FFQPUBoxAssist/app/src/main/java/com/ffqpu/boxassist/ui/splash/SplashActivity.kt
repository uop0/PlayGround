package com.ffqpu.boxassist.ui.splash

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import com.ffqpu.boxassist.R
import com.ffqpu.boxassist.ui.home.MainActivity

// شاشة البداية: لوجو متحرك Fade + Scale لمدة ثانيتين
@SuppressLint("CustomSplashScreen")
class SplashActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_splash)
        val logo = findViewById<android.view.View>(R.id.logoBox)
        logo.alpha = 0f; logo.scaleX = 0.7f; logo.scaleY = 0.7f
        logo.animate().alpha(1f).scaleX(1f).scaleY(1f).setDuration(1200).start()
        Handler(Looper.getMainLooper()).postDelayed({
            startActivity(Intent(this, MainActivity::class.java))
            finish()
        }, 2000)
    }
}
