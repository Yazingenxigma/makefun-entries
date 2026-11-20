# The World in One Picture — Friday, 20 November 2026

A newspaper front page summing up 20 November 2026's world news in one
1024x1024 image, `entry.png`.

Top stories:
- World Court rules Myanmar committed genocide against the Rohingya
- Trump, Xi and Putin hold their first three-way summit in Shenzhen
- Russia strikes Kyiv bridges; 8 killed
- Houthi missile damages Riyadh's PIF tower
- Stocks fall for a fifth day; Nikkei -4.8%; Anthropic +17% on debut
- Kenya's last Ebola patient discharged
- Poland: Russia violates airspace; Estonia closes its border

`main.py` (Python 3.13, standard library only) copies `entry.png` to
`$MAKEFUN_OUTPUT_DIR/entry.png`. It uses no network and is deterministic:
running it twice writes the same bytes.
