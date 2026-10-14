package com.ffqpu.boxassist.ui.home

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ffqpu.boxassist.util.Constants
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.net.HttpURLConnection
import java.net.URL

// منطق الاتصال الوهمي + Ping متحرك (استبدل بفحص حقيقي لخوادمك)
class HomeViewModel : ViewModel() {

    private val _status = MutableLiveData(false)
    val status: LiveData<Boolean> = _status
    private val _ping = MutableLiveData("--")
    val ping: LiveData<String> = _ping
    private val _connecting = MutableLiveData(false)
    val connecting: LiveData<Boolean> = _connecting

    fun connect(link: String, server: String) {
        if (_connecting.value == true) return
        _connecting.value = true
        viewModelScope.launch {
            val ms = fakePing(server)
            _ping.value = "$ms ms"
            _status.value = ms < 900
            _connecting.value = false
        }
    }

    private suspend fun fakePing(server: String): Int {
        return try {
            val url = URL(Constants.pingEndpoint(server))
            val t = System.currentTimeMillis()
            // مهلة قصيرة حتى لا يعلق التطبيق
            val c = with(url.openConnection() as HttpURLConnection) {
                connectTimeout = 2500; readTimeout = 2500; this
            }
            delay(400) // تأثير بصري
            c.disconnect()
            ((System.currentTimeMillis() - t) % 400 + 40).toInt()
        } catch (_: Exception) {
            delay(800)
            // بدون إنترنت نعتبره متصلاً وهمياً للعرض
            (80..320).random()
        }
    }
}
