package com.ffqpu.boxassist.util

// التحقق من روابط البث: tiktok.com/@user/live  أو  @FFQPU
object TikTokLinkValidator {
    private val liveRegex = Regex("""^(https?://)?(www\.|vm\.|vt\.)?(tiktok\.com/[^/\s]+(/live)?).*$""")
    private val handleRegex = Regex("""^@[\w.\-]{1,24}$""")

    fun isValid(input: String): Boolean {
        val t = input.trim()
        return liveRegex.matches(t) || handleRegex.matches(t) || t.contains("/live")
    }

    fun normalize(input: String): String {
        val t = input.trim()
        if (t.startsWith("@")) return "https://www.tiktok.com/$t/live"
        if (t.startsWith("http")) return t
        return "https://www.tiktok.com/$t"
    }
}
