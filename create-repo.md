# GitHub 저장소 생성 방법

## 빠른 방법 (웹에서)

1. https://github.com/new 접속
2. Repository name: `vccc`
3. Description: `화장품 용기 도장 견적 시스템`
4. Public 또는 Private 선택
5. **"Initialize this repository with a README" 체크 해제**
6. "Create repository" 클릭

저장소를 만든 후 아래 명령어를 실행하세요:

```bash
git push -u origin main
```

## 또는 GitHub CLI 사용

GitHub CLI를 설치한 후:

```bash
gh auth login
gh repo create vccc --public --source=. --remote=origin --push
```

