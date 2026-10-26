# VoiceOver + Safari helpers for docs/accessibility/voiceover-script.md.
# Usage: source tools/voiceover.sh; vo_start; go http://localhost:4200/catalog/1; into; to "Add to cart"; act; poll
# Needs: VoiceOver Utility → General → "Allow VoiceOver to be controlled with AppleScript",
# and Automation (and, for key/tab/typ, Accessibility) access for the terminal app.

vo_start() { osascript -e 'tell application "VoiceOver" to activate'; sleep 4; }
vo_stop() { osascript -e 'tell application "VoiceOver" to quit'; }
# The phrase VoiceOver spoke last
last() { osascript -e 'tell application "VoiceOver" to get content of last phrase' 2>&1; }
go() { osascript -e 'tell application "Safari" to activate' -e "tell application \"Safari\" to set URL of current tab of front window to \"$1\""; sleep 7; }

# VoiceOver cursor: VO+Right, VO+Shift+Down / Up, VO+Space
vor() { osascript -e 'tell application "VoiceOver" to tell vo cursor to move right' 2>&1; }
into() { osascript -e 'tell application "VoiceOver" to tell vo cursor to move into item' 2>&1; sleep 0.6; }
out() { osascript -e 'tell application "VoiceOver" to tell vo cursor to move out of item' 2>&1; sleep 0.6; }
act() { osascript -e 'tell application "VoiceOver" to tell vo cursor to perform action' 2>&1; }

# Keyboard, through System Events: key codes 48 Tab, 124 Right
key() { local m=""; [ -n "$2" ] && m=" using {$2}"; osascript -e "tell application \"System Events\" to key code $1$m" 2>&1; }
tab() { key 48; }
stab() { key 48 "shift down"; }
typ() { osascript -e "tell application \"System Events\" to keystroke \"$1\"" 2>&1; }

# VO+Right until the spoken phrase contains $1 (at most $2 moves)
to() {
  local l
  for _ in $(seq 1 "${2:-40}"); do
    vor; sleep 0.5; l=$(last)
    case "$l" in *"$1"*) echo "at: $l"; return 0 ;; esac
  done
  echo "not found: $1 (at: $l)"; return 1
}
# Every distinct phrase spoken over the next ~$1 × 0.15 s: catches live-region announcements
poll() { for _ in $(seq 1 "${1:-30}"); do echo "  $(last)"; sleep 0.15; done | uniq; }
