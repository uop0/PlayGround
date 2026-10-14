package com.ffqpu.boxassist.ui.settings

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.ffqpu.boxassist.BoxAssistApp
import com.ffqpu.boxassist.data.PrefsManager
import com.ffqpu.boxassist.databinding.ActivitySettingsBinding

// شاشة الإعدادات: السرعة، العشوائية، الحجم، الشفافية، الشكل، الاهتزاز، العدد المستهدف
class SettingsActivity : AppCompatActivity() {

    private lateinit var b: ActivitySettingsBinding
    private lateinit var prefs: PrefsManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = (application as BoxAssistApp).prefs
        b = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(b.root)
        setSupportActionBar(b.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)

        // السرعة 50..2000ms
        b.speedSlider.valueFrom = 50f; b.speedSlider.valueTo = 2000f
        b.speedSlider.value = prefs.intervalMs.toFloat()
        b.tvSpeedVal.text = "${prefs.intervalMs} ms"
        b.speedSlider.addOnChangeListener { _, v, _ ->
            prefs.intervalMs = v.toInt()
            b.tvSpeedVal.text = "${v.toInt()} ms"
        }

        b.swRandom.isChecked = prefs.randomPress
        b.swRandom.setOnCheckedChangeListener { _, c -> prefs.randomPress = c }

        b.sizeSlider.valueFrom = 0.6f; b.sizeSlider.valueTo = 1.8f
        b.sizeSlider.value = prefs.floatScale
        b.sizeSlider.addOnChangeListener { _, v, _ -> prefs.floatScale = v }

        b.alphaSlider.valueFrom = 0.3f; b.alphaSlider.valueTo = 1f
        b.alphaSlider.value = prefs.floatAlpha
        b.alphaSlider.addOnChangeListener { _, v, _ -> prefs.floatAlpha = v }

        when (prefs.floatShape) {
            "square" -> b.chipSquare.isChecked = true
            "hand" -> b.chipHand.isChecked = true
            else -> b.chipCircle.isChecked = true
        }
        b.shapeGroup.setOnCheckedStateChangeListener { _, ids ->
            prefs.floatShape = when {
                ids.contains(b.chipSquare.id) -> "square"
                ids.contains(b.chipHand.id) -> "hand"
                else -> "circle"
            }
        }

        b.swVibrate.isChecked = prefs.vibrateOnClick
        b.swVibrate.setOnCheckedChangeListener { _, c -> prefs.vibrateOnClick = c }

        b.etTarget.setText(if (prefs.targetClicks == 0) "" else prefs.targetClicks.toString())
        b.etTarget.setOnFocusChangeListener { _, has ->
            if (!has) prefs.targetClicks =
                b.etTarget.text.toString().toIntOrNull()?.coerceIn(0, 100000) ?: 0
        }

        // Multi-touch 1..3
        b.multiGroup.check(
            when (prefs.multiTouchPoints) {
                2 -> b.radio2.id; 3 -> b.radio3.id; else -> b.radio1.id
            }
        )
        b.multiGroup.setOnCheckedChangeListener { _, id ->
            prefs.multiTouchPoints = when (id) {
                b.radio2.id -> 2; b.radio3.id -> 3; else -> 1
            }
        }
    }

    override fun onSupportNavigateUp(): Boolean { finish(); return true }
}
