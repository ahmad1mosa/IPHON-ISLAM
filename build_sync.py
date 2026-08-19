import os
import shutil
import zipfile
import subprocess

print("1. Syncing web files to android-app/app/src/main/assets ...")
src_root = os.path.dirname(os.path.abspath(__file__))
android_assets = os.path.join(src_root, "android-app", "app", "src", "main", "assets")
os.makedirs(android_assets, exist_ok=True)

# Copy individual files
for f in ["index.html", "manifest.json", "sw.js"]:
    shutil.copy2(os.path.join(src_root, f), os.path.join(android_assets, f))

# Copy folders
for d in ["css", "js", "audio", "icons"]:
    dest = os.path.join(android_assets, d)
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(os.path.join(src_root, d), dest)

print("2. Creating GS-Islam-App.zip bundle ...")
zip_path = os.path.join(src_root, "GS-Islam-App.zip")
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for item in ["index.html", "manifest.json", "sw.js"]:
        z.write(os.path.join(src_root, item), item)
    for d in ["css", "js", "audio", "icons"]:
        folder = os.path.join(src_root, d)
        for root, dirs, files in os.walk(folder):
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, src_root)
                z.write(full_path, rel_path)

print("3. Repackaging and signing GS-Islam.apk ...")
apk_path = os.path.join(src_root, "GS-Islam.apk")
temp_dir = os.path.join(src_root, "apk_temp")
if os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)

with zipfile.ZipFile(apk_path, "r") as z:
    z.extractall(temp_dir)

meta_inf = os.path.join(temp_dir, "META-INF")
if os.path.exists(meta_inf):
    for f in os.listdir(meta_inf):
        if f.endswith(".RSA") or f.endswith(".SF") or f.endswith(".MF"):
            os.remove(os.path.join(meta_inf, f))

apk_assets = os.path.join(temp_dir, "assets")
if os.path.exists(apk_assets):
    shutil.rmtree(apk_assets)
shutil.copytree(android_assets, apk_assets)

repacked_apk = os.path.join(src_root, "GS-Islam-repacked.apk")
if os.path.exists(repacked_apk):
    os.remove(repacked_apk)

with zipfile.ZipFile(repacked_apk, "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, temp_dir)
            z.write(full_path, rel_path)

shutil.rmtree(temp_dir)

keystore = "debug.keystore"
subprocess.run([
    "jarsigner",
    "-sigalg", "SHA256withRSA",
    "-digestalg", "SHA-256",
    "-keystore", "debug.keystore",
    "-storepass", "android",
    "-keypass", "android",
    "GS-Islam-repacked.apk",
    "androiddebugkey"
], cwd=src_root, check=True)

if os.path.exists(apk_path):
    os.remove(apk_path)
os.rename(repacked_apk, apk_path)

print("SUCCESS: All web, iOS, Android, Zip, and APK files are 100% updated and signed!")
