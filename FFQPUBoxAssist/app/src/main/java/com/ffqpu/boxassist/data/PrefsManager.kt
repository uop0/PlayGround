package com.ffqpu.boxassist.data

import android.content.Context
import android.content.SharedPreferences
import androidx.core.content.edit

// إدارة كل الإعدادات في SharedPreferences — تحفظ محلياً
class PrefsManager(context: Context) {

    private val sp: SharedPreferences =
        context.getSharedPreferences("ffqpu_prefs", Context.MODE_PRIVATE)

    var liveLink: String
        get() = sp.getString(K_LINK, "") ?: ""
        set(v) = sp.edit { putString(K_LINK, v) }

    var username: String
        get() = sp.getString(K_USER, "@FFQPU") ?: "@FFQPU"
        set(v) = sp.edit { putString(K_USER, v) }

    var serverType: String
        get() = sp.getString(K_SERVER, "Auto") ?: "Auto"
        set(v) = sp.edit { putString(K_SERVER, v) }

    // سرعة الضغط بالمللي ثانية (50..2000)
    var intervalMs: Int
        get() = sp.getInt(K_INTERVAL, 300)
        set(v) = sp.edit { putInt(K_INTERVAL, v.coerceIn(50, 2000)) }

    var randomPress: Boolean
        get() = sp.getBoolean(K_RANDOM, true)
        set(v) = sp.edit { putBoolean(K_RANDOM, v) }

    // حجم الزر العائم 0.6x .. 1.8x
    var floatScale: Float
        get() = sp.getFloat(K_SCALE, 1f)
        set(v) = sp.edit { putFloat(K_SCALE, v.coerceIn(0.6f, 1.8f)) }

    var floatAlpha: Float
        get() = sp.getFloat(K_ALPHA, 1f)
        set(v) = sp.edit { putFloat(K_ALPHA, v.coerceIn(0.3f, 1f)) }

    // circle | square | hand
    var floatShape: String
        get() = sp.getString(K_SHAPE, "circle") ?: "circle"
        set(v) = sp.edit { putString(K_SHAPE, v) }

    var vibrateOnClick: Boolean
        get() = sp.getBoolean(K_VIB, false)
        set(v) = sp.edit { putBoolean(K_VIB, v) }

    // عدد الضغطات المطلوب ثم التوقف (0 = لا نهائي)
    var targetClicks: Int
        get() = sp.getInt(K_TARGET, 0)
        set(v) = sp.edit { putInt(K_TARGET, v.coerceIn(0, 100000)) }

    var multiTouchPoints: Int
        get() = sp.getInt(K_MULTI, 1)
        set(v) = sp.edit { putInt(K_MULTI, v.coerceIn(1, 3)) }

    var fixedX: Int
        get() = sp.getInt(K_FX, -1)
        set(v) = sp.edit { putInt(K_FX, v) }
    var fixedY: Int
        get() = sp.getInt(K_FY, -1)
        set(v) = sp.edit { putInt(K_FY, v) }

    var disclaimerAccepted: Boolean
        get() = sp.getBoolean(K_DISC, false)
        set(v) = sp.edit { putBoolean(K_DISC, v) }

    var language: String // "ar" | "en"
        get() = sp.getString(K_LANG, "ar") ?: "ar"
        set(v) = sp.edit { putString(K_LANG, v) }

    companion object {
        private const val K_LINK = "live_link"
        private const val K_USER = "username"
        private const val K_SERVER = "server"
        private const val K_INTERVAL = "interval_ms"
        private const val K_RANDOM = "random"
        private const val K_SCALE = "scale"
        private const val K_ALPHA = "alpha"
        private const val K_SHAPE = "shape"
        private const val K_VIB = "vibrate"
        private const val K_TARGET = "target"
        private const val K_MULTI = "multi"
        private const val K_FX = "fx"
        private const val K_FY = "fy"
        private const val K_DISC = "disclaimer"
        private const val K_LANG = "lang"
    }
}
