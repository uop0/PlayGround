package com.ffqpu.boxassist

import android.app.Application
import com.ffqpu.boxassist.data.PrefsManager
import com.ffqpu.boxassist.util.LocaleHelper

// نقطة دخول التطبيق : تهيئة اللغة والتفضيلات
class BoxAssistApp : Application() {
    lateinit var prefs: PrefsManager
        private set

    override fun onCreate() {
        super.onCreate()
        prefs = PrefsManager(this)
        LocaleHelper.applySavedLocale(this)
    }
}
