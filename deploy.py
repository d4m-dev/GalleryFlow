#!/usr/bin/env python3
# ==============================================================================
# COPYRIGHT: D4M-DEV
# PROJECT: GalleryFlow
# ==============================================================================

import subprocess
import sys
import threading
import time
import itertools

class Spinner:
    def __init__(self, message="Đang xử lý..."):
        self.spinner = itertools.cycle(['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'])
        self.message = message
        self.busy = False
        self.delay = 0.1

    def spinner_task(self):
        while self.busy:
            sys.stdout.write(f'\r\033[96m{next(self.spinner)}\033[0m {self.message}')
            sys.stdout.flush()
            time.sleep(self.delay)
            sys.stdout.write('\r\033[K')

    def start(self):
        self.busy = True
        threading.Thread(target=self.spinner_task, daemon=True).start()

    def stop(self, success=True, end_msg=""):
        self.busy = False
        time.sleep(self.delay)
        sys.stdout.write('\r\033[K')
        if success:
            print(f"[\033[92m✔\033[0m] {end_msg}")
        else:
            print(f"[\033[91m✖\033[0m] {end_msg}")

def run_command(command):
    try:
        result = subprocess.run(command, shell=True, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        return False, e.stdout + "\n" + e.stderr

def main():
    print("\033[95m" + "=" * 60)
    print("🚀 TỰ ĐỘNG ĐẨY CODE LÊN GITHUB (BỎ QUA KIỂM TRA)")
    print("Bản quyền: D4M-DEV")
    print("Repo: git@github.com:d4m-dev/GalleryFlow.git")
    print("=" * 60 + "\033[0m\n")

    print("\n\033[92m🎉 Chuẩn bị push code...\033[0m\n")

    # Git commands
    spinner = Spinner("Đang chuẩn bị git và đẩy code...")
    spinner.start()
    
    commands = [
        "git add .",
        'git commit -m "Auto deploy from D4M-DEV script"',
        "git branch -M main",
        "git remote add origin git@github.com:d4m-dev/GalleryFlow.git || git remote set-url origin git@github.com:d4m-dev/GalleryFlow.git",
        "git push -u origin main"
    ]
    
    for cmd in commands:
        success, output = run_command(cmd)
        if not success:
            # Bỏ qua lỗi commit nếu không có thay đổi nào
            if "nothing to commit" in output or "no changes added to commit" in output:
                continue
                
            # Tự động sửa lỗi khi push
            if "git push" in cmd:
                spinner.stop(False, f"Lỗi push. Đang thử tự động sửa...")
                
                # Thử pull rebase
                spinner = Spinner("Đang pull --rebase và push lại...")
                spinner.start()
                run_command("git pull origin main --rebase")
                success, output = run_command(cmd)
                
                if not success:
                    spinner.stop(False, f"Pull rebase không thành công, đang force push...")
                    spinner = Spinner("Đang force push...")
                    spinner.start()
                    success, output = run_command(cmd + " --force")
                    
                if success:
                    continue

            spinner.stop(False, f"Lỗi khi chạy lệnh Git: {cmd}")
            print(f"\033[93mChi tiết lỗi:\033[0m\n{output}")
            return

    spinner.stop(True, "Đẩy code lên Github thành công!")
    print("\n\033[92m✨ HOÀN TẤT TỰ ĐỘNG TRIỂN KHAI (D4M-DEV)!\033[0m")

if __name__ == "__main__":
    main()
