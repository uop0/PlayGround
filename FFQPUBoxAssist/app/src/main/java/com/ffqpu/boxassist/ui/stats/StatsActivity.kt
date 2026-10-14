package com.ffqpu.boxassist.ui.stats

import android.graphics.Color
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.ffqpu.boxassist.data.StatsRepository
import com.ffqpu.boxassist.databinding.ActivityStatsBinding
import com.github.mikephil.charting.components.XAxis
import com.github.mikephil.charting.data.BarData
import com.github.mikephil.charting.data.BarDataSet
import com.github.mikephil.charting.data.BarEntry

// شاشة الإحصائيات + رسم بياني بسيط
class StatsActivity : AppCompatActivity() {

    private lateinit var b: ActivityStatsBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        b = ActivityStatsBinding.inflate(layoutInflater)
        setContentView(b.root)
        setSupportActionBar(b.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        val repo = StatsRepository(this)
        b.tvClicks.text = "${repo.totalClicks}"
        b.tvSessions.text = "${repo.totalSessions}"
        val m = repo.totalDurationSec / 60
        val s = repo.totalDurationSec % 60
        b.tvDuration.text = "%02d:%02d".format(m, s)

        drawChart(repo.getHistory())
        b.btnReset.setOnClickListener { repo.reset(); recreate() }
    }

    private fun drawChart(history: List<Int>) {
        val entries = history.mapIndexed { i, v -> BarEntry(i.toFloat(), v.toFloat()) }
        val set = BarDataSet(entries, "Clicks").apply {
            color = Color.parseColor("#00E5FF")
            valueTextColor = Color.WHITE; valueTextSize = 10f
        }
        b.chart.data = BarData(set)
        b.chart.description.isEnabled = false
        b.chart.legend.textColor = Color.WHITE
        b.chart.xAxis.apply {
            position = XAxis.XAxisPosition.BOTTOM
            textColor = Color.GRAY; setDrawGridLines(false)
        }
        b.chart.axisLeft.textColor = Color.GRAY
        b.chart.axisRight.isEnabled = false
        b.chart.invalidate()
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
