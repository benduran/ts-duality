## 0.0.1-beta.13 (2025-10-30)

### ✨ Features ✨

- feat: render cjs or mjs files to disk (b4f35631ccd0678da6ba3425ddf4210766a579bd)



### 🔀 Miscellaneous 🔀

- Merge pull request #3 from benduran/bduran/format-json-with-prettier-if-possible (69b40997652b86268f1be63e668911eca61abc62)

---

## 0.0.1-beta.12 (2025-10-30)

### 🛠️ Fixes 🛠️

- fix: fixed double execution (360b380d758255243b50a93c0e93a3a7899e231b)

---

## 0.0.1-beta.11 (2025-10-30)

### ✨ Features ✨

- feat: format with relative paths, just in case (f48ac20bd779c6f0fb1782a138e0e8abe29db591)
- feat: format with prettier if it's installed (e81ef62c7776a85b2384189cbdecbf504af27c26)



### 🔀 Miscellaneous 🔀

- Merge pull request #2 from benduran/bduran/engines-loosen (adc548e2f15a5e2390ecbc4667c29db77eb1019c)

---

## 0.0.1-beta.10 (2025-10-30)

### 🔀 Miscellaneous 🔀

- chore: loosened the engines range (722e1db7fe7c09c7bd613761a0ae648a5d796ed6)
- Merge pull request #1 from benduran/bduran/add-lets-version (a81f6908cff52e2cd8e74a9f39a10e00364d8fd6)

---

## 0.0.1-beta.9 (2025-10-29)

### 🛠️ Fixes 🛠️

- fix: fixed copy behavior to use the rootDir and not the individual src dirs (2901b8df8d86e586fb035e5819bb4470c3399f70)

---

## 0.0.1-beta.8 (2025-10-29)

### 🛠️ Fixes 🛠️

- fix: fixed extra exports using wrong library key (91a7bb77bbd72bdc6dc1013e933c26b776e20d04)

---

## 0.0.1-beta.7 (2025-10-29)

### 🛠️ Fixes 🛠️

- fix: fixed non-source files accidentally getting rewritten import paths and extensions (dbf0e4d5b64b221de5089835c1e811b27217788c)

---

## 0.0.1-beta.6 (2025-10-29)

### ✨ Features ✨

- feat: added support for copying non source files to the output dir (8638979f90935fb06d39e0227ab0ceb2b7bd9f3c)



### 🔀 Miscellaneous 🔀

- chore: removed unused values (e1db62126270ba5153975434168fc52220294fc9)

---

## 0.0.1-beta.5 (2025-10-28)

### 🛠️ Fixes 🛠️

- fix: actually log messages on failure by switching to execa (fa3de20754793403e9af3ed25496e7595af38e22)

---

## 0.0.1-beta.4 (2025-10-28)

### 🛠️ Fixes 🛠️

- fix: moved typescript to peerDep and type-fest to prod dep (6eaa4bc80648e872c7df4638938a43648c80a355)

---

## 0.0.1-beta.3 (2025-10-28)

### 🔀 Miscellaneous 🔀

- chore: updated lint config and disable prettier while working in this repo (d331220fc65dec2f46f73fef9fcdbb93d748a77d)

---

## 0.0.1-beta.2 (2025-10-28)

### 🛠️ Fixes 🛠️

- fix: fixed binfile shenanigans (cd21f2c42e7cf794ee54e862d466630164e58fea)

---

## 0.0.1-beta.1 (2025-10-28)

### 🔀 Miscellaneous 🔀

- chore: lint fixes (06cffe1d1899562fee3178d49f76919a4d720b48)
- chore: removed private from package.json (092865e9c2a2b0629edcadeab55e27e119a8cd9b)

---

## 0.0.1-beta.0 (2025-10-27)

### 🔀 Miscellaneous 🔀

- chore: bumped deps (fb14673deecfc598954665f55990f30e6a371cd0)
- chore: added husky to verify commit messages (46a4b7a6753bb2e299758a1ccfb240764cf08aae)
- chore: shuffled some things around to improve organization and added typing documentation (64173ab51ec8f83cf5f8cad7e42ab070334bd51e)
- chore: setup PNPM (34e3748e2bdf15fb407106583593f6aeda57d2cc)
- Initial commit (7bb8911ca498966c12a071ffea944d44bf350ab7)



### ✨ Features ✨

- feat: added strict flag checking (af5ef55ccfd562317edfc34d532238682ff0d5f0)
- feat: added some typescript tsconfig.json compilerOptions updating when bad props are detected (bab67312c10cc55e1e68aa5fa937735d1d27d866)
- feat: maintain json file indentation sizings (282fa7200174b6c44ba68b606680452c909130f4)
- feat: added binfile (14993b59520faa794f32f62ef71b11a64feb85d0)
- feat: added main exports (fba5157d63ec116393510fb23e0da4ce82625b9a)
- feat: ouroborous, build the dual-publish lib with itself (c24322d314d8b6030002af1665462cba37d6df7f)
- feat: added running via pm functions (4d48562b6a811643a51ede79e5ecf79916a53bd7)
- feat: ported all bundling logic to typescript from another repo (adb84a3086315b03fd7a057eb8660864b8d84313)

---

