grep -A 10 "WorkoutTracker.snapPoints" "$(ls -t ~/.expo/log*.txt 2>/dev/null | head -n 1)" || echo "No logs found"
