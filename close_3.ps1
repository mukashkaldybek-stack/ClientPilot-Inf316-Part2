$issues = @(18, 19, 20)
foreach ($num in $issues) {
    Write-Host "Closing issue #$num..."
    gh issue comment $num --body-file comment_3.txt
    gh issue close $num
    Start-Sleep -Milliseconds 300
}
Write-Host "Issues 18, 19, 20 closed successfully."
