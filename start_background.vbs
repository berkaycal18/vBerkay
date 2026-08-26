Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c node server.js --tunnel", 0, False
