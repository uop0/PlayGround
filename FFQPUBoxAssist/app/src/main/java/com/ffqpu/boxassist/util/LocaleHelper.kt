package com.ffqpu.boxassist.util

import android.content.Context
import android.content.res.Configuration
import com.ffqpu.boxassist.data.PrefsManager
import java.util.Locale

// تبديل اللغة العربية / الإنجليزية مع دعم RTL
object LocaleHelper {
    fun applySavedLocale(context: Context) {
        val lang = PrefsManager(context).language
        setLocale(context, lang)
    }

    fun setLocale(context: Context, lang: String) {
        val locale = Locale(lang)
        Locale.setDefault(locale)
        val res = context.resources
        val cfg = Configuration(res.configuration)
        cfg.setLocale(locale)
        cfg.setLayoutDirection(locale)
        @Suppress("DEPRECATION")
        res.updateConfiguration(cfg, res.displayMetrics)
    }
}
