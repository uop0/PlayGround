package com.ffqpu.boxassist.data

import android.content.Context
import androidx.core.content.edit
import org.json.JSONArray

// مخزن الإحصائيات: عدد النقرات، مدة التشغيل، الجلسات + سجل للرسم البياني
class StatsRepository(context: Context) {

    private val sp = context.getSharedPreferences("ffqpu_stats", Context.MODE_PRIVATE)

    var totalClicks: Long
        get() = sp.getLong("total_clicks", 0)
        private set(v) = sp.edit { putLong("total_clicks", v) }

    var totalSessions: Int
        get() = sp.getInt("sessions", 0)
        private set(v) = sp.edit { putInt("sessions", v) }

    var totalDurationSec: Long
        get() = sp.getLong("duration", 0)
        private set(v) = sp.edit { putLong("duration", v) }

    fun addClicks(n: Long) { totalClicks += n }

    fun finishSession(clicks: Long, durationSec: Long) {
        totalClicks += clicks
        totalDurationSec += durationSec
        totalSessions += 1
        appendHistory(clicks.toInt())
    }

    fun getHistory(): List<Int> {
        val raw = sp.getString("history", "[]") ?: "[]"
        val out = mutableListOf<Int>()
        try {
            val arr = JSONArray(raw)
            for (i in 0 until arr.length()) out.add(arr.optInt(i))
        } catch (_: Exception) {}
        return out.takeLast(14)
    }

    private fun appendHistory(clicks: Int) {
        val h = getHistory().toMutableList()
        h.add(clicks)
        val arr = JSONArray()
        h.takeLast(14).forEach { arr.put(it) }
        sp.edit { putString("history", arr.toString()) }
    }

    fun reset() = sp.edit {
        putLong("total_clicks", 0); putInt("sessions", 0)
        putLong("duration", 0); putString("history", "[]")
    }
}
