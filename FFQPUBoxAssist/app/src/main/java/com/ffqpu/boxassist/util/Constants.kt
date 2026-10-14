package com.ffqpu.boxassist.util

// ثوابت عامة + عناوين خوادم وهمية للعرض
object Constants {
    const val MIN_INTERVAL = 50
    const val MAX_INTERVAL = 2000
    const val OVERLAY_REQ = 101
    const val NOTIF_ID = 1001
    const val CHANNEL_ID = "ffqpu_overlay"

    val SERVERS = listOf("Server 1", "Server 2", "Server 3", "Auto")

    // عناوين تجريبية — استبدلها بخوادمك الحقيقية
    fun pingEndpoint(server: String): String = when (server) {
        "Server 1" -> "https://s1.ffqpu.example/ping"
        "Server 2" -> "https://s2.ffqpu.example/ping"
        "Server 3" -> "https://s3.ffqpu.example/ping"
        else -> "https://auto.ffqpu.example/ping"
    }
}
