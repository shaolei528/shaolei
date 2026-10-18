"""Pinned official Godot and matching templates for reproducible CI."""
import hashlib, pathlib, urllib.request, zipfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
TOOLS = ROOT / '.tools'
TOOLS.mkdir(exist_ok=True)
url = 'https://github.com/godotengine/godot-builds/releases/download/4.7.2-stable/Godot_v4.7.2-stable_linux.x86_64.zip'
archive = TOOLS / 'godot.zip'
urllib.request.urlretrieve(url, archive)
expected = 'cadd3204e728a35d3f13adb7fd0d7902636b79f6b95c40c265eb73b6c35329e4'
assert hashlib.sha256(archive.read_bytes()).hexdigest() == expected, 'Engine SHA256 mismatch'
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    z.extractall(TOOLS)
(TOOLS / 'Godot_v4.7.2-stable_linux.x86_64').chmod(0o755)
url = 'https://github.com/godotengine/godot-builds/releases/download/4.7.2-stable/Godot_v4.7.2-stable_export_templates.tpz'
archive = TOOLS / 'templates.tpz'
urllib.request.urlretrieve(url, archive)
target = TOOLS / 'share/godot/export_templates/4.7.2.stable'
target.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(archive) as z:
    for info in z.infolist():
        name = pathlib.PurePosixPath(info.filename).name
        if name in ('version.txt','web_nothreads_release.zip','web_nothreads_debug.zip'):
            (target / name).write_bytes(z.read(info))
print('Pinned engine SHA verified; selected templates ZIP CRC verified')
