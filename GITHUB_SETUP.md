# GitHub 저장소 연결 가이드

## 1. GitHub에서 저장소 생성

1. https://github.com/new 접속
2. Repository name: `vccc` (또는 원하는 이름)
3. Description: `화장품 용기 도장 견적 시스템`
4. Public 또는 Private 선택
5. **"Initialize this repository with a README" 체크 해제** (이미 로컬에 파일이 있으므로)
6. "Create repository" 클릭

## 2. 로컬 저장소와 연결

GitHub에서 저장소를 생성한 후, 아래 명령어를 실행하세요:

```bash
# GitHub 저장소 URL을 원격 저장소로 추가
git remote add origin https://github.com/YOUR_USERNAME/vccc.git

# 또는 SSH 사용 시
git remote add origin git@github.com:YOUR_USERNAME/vccc.git

# 메인 브랜치를 main으로 설정
git branch -M main

# GitHub에 푸시
git push -u origin main
```

**주의**: `YOUR_USERNAME`을 본인의 GitHub 사용자명으로 변경하세요!

## 3. 확인

```bash
# 원격 저장소 확인
git remote -v

# 상태 확인
git status
```

