# Project Process

코드당은 학생들이 주체적으로 진행하는 프로젝트예요.
그래서 일반적인 회사의 프로젝트와는 다른 특징들을 고려한 특화된 프로세스가 필요해요.
예를 들어 풀타임 근무가 아닌 점, 흥미를 잃지 않도록 동기 부여가 충분히 이뤄져야 한다는 점, 팀원 수명이 비교적 짧은 점(1~2년) 등이 있어요.

이러한 점을 고려하여, 스꾸딩은 널리 사용되는 애자일 방법론을 일부 수정하여 프로세스를 적용했어요.
애자일 방법론이 익숙하지 않다면 다음 글을 읽어보세요: [애자일은 일을 재빠르게 하는 것이 아니다.](https://brunch.co.kr/@svillustrated/24)

## Sprint

스프린트란 팀의 일을 마감하는 기간으로, 빠른 반영과 지속적인 개선을 위해 짧은 주기로 반복해요.
코드당 프로젝트는 스프린트를 2주 단위로 설정하여 아래 순서로 진행해요.

1. **Task 생성**
2. **코드 작성 및 Commit**
3. **Pull Request 생성 및 리뷰**
4. **스테이지 환경 테스트 후 배포**
5. **모니터링 및 유지보수**

유의해야할 점은 코드가 배포되었다고 해서 끝나는 것이 아니라, 사용자가 사용하는 동안 지속적으로 모니터링하고 유지보수해야 한다는 점이에요.
앞서 말한 특징 중 팀원 수명이 짧다는 점을 고려하면, 유지보수가 원활하게 되도록 코드를 작성할 때 코드에 담기지 않은 배경 상황을 주석으로 남기거나, 짧은 코드보다 읽기 쉬운 코드를 작성하는 등의 노력이 필요해요.

## 1. Task 생성

Task는 프로젝트의 목표를 달성하기 위한 최소 단위의 작업이에요.
하지만 프로젝트의 시작은 task를 생성하는 것이 아니라, 큰 문제를 해결하기 위한 목표를 설정하는 것이에요.
작업 단위는 아래와 같이 이루어져요.

- **Task**: 개발자가 수행할 수 있는 최소 단위의 작업
- **Epic**: 여러 스프린트를 거쳐 완료되는, 여러 Task로 이뤄진 큰 작업
- **OKR**: 프로젝트의 목표를 달성하기 위한 분기별(학기 / 방학) 팀 목표

따라서 프로젝트는 학기나 방학이 시작할 때 팀원들이 함께 OKR을 설정하고, 이를 달성하기 위한 epic을 설정해요.
그리고 각 epic은 task로 세분화되어 팀원들이 작업을 수행하게 돼요.
Epic과 task 목록은 Notion에서 확인할 수 있어요. ([Epic 목록](https://www.notion.so/skkuding/3ee40137db5f40adab8fa69daf7e5f2b), [Task 목록](https://www.notion.so/skkuding/b363c0bd41d541969b15fa282f7594d4))

### Epic 및 Task 생성 규칙 {#task-rule}

- Epic과 큰 task 생성 시 마감일과 우선순위는 기획 팀과 개발 팀이 함께 논의해야 해요.
- Task 생성 시 담당 팀과 태그를 반드시 설정해주세요. 담당자가 정해졌다면 담당자도 설정해주세요.
- Hotfix(급한 수정)이 아니라면, task는 모두 epic에 속해야 해요.
- 일반적으로 우선 순위는 [중요한 버그 > 외부 요청(교수님 등) > 사소한 버그 > 기능 개발] 순으로 설정해요.
- Epic과 task에 대한 논의는 Notion 내 댓글로 이뤄져야 해요. 논의와 task 내용을 한 곳에 모으기 위해 Teams 사용은 자제해주세요.
- 논의 중 다른 epic이나 task 참조가 필요한 경우 `@`으로 멘션해주세요.

> ### GitHub Issue 생성
> 24.08.07. 수정: 더 이상 Github Issue를 사용하지 않습니다. 자세한 배경은 [팀즈 공지](https://teams.microsoft.com/l/message/19:a3f962f90fa246798e0299952fcff693@thread.tacv2/1723006542712?tenantId=88d445e5-e9b0-4cd3-815f-40f8a3009b42&groupId=ae346662-b2db-49e7-815e-6532a72ef07d&parentMessageId=1723006542712&teamName=SKKUDING%20%EC%8A%A4%EA%BE%B8%EB%94%A9&channelName=all-%EA%B3%B5%EC%A7%80&createdTime=1723006542712)를 확인해주세요.
> 
> 개발을 시작하기 전 task를 GitHub Issue로 생성해야 해요.
> Task와 GitHub issue, 그리고 pull request는 가급적 1:1:1로 대응해야 해요.
> 이를 고려해서 GitHub issue를 생성해주세요.

> Issue 생성 시 템플릿에 따라 내용은 간단하게 적고 구현 동기와 이유, 간단한 설계(예: 어떤 함수/라이브러리를 변경/사용할지) 등을 적어주세요.
> 실제 구현 과정에서 원래 생각했던 내용과 다른 게 있을 수 있으니, 구현 방식과 코드에 대한 상세한 내용은 pull request에서 작성해주세요.


## 2. 코드 작성 및 Commit

### Branch 생성

Task를 생성하고 GitHub Issue를 생성했다면, 개발을 위한 git branch를 생성해주세요.
코드당 프로젝트에서는 GitHub Flow와 유사한 branch 전략을 사용해요. (참고: [Git Flow vs GitHub Flow](https://www.alexhyett.com/git-flow-github-flow/))

- `main` branch는 배포 가능한 상태를 유지해야 하며, 개발은 `main` branch에서 새로운 branch를 생성하여 진행해야 해요.
- Branch 이름은 `t{notion-task-ID-without-prefix}-{description}` 형식으로 생성해주세요. (예: 로그인 페이지를 만드는 123번 task를 위한 branch는 `t123-login-page`)
- Branch 이름의 모든 글자는 숫자, 영문 소문자, 그리고 `-`만 사용할 수 있어요.

### Commit Convention

[Angular commit convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular#angular-convention)을 따라 commit message를 작성해주세요. 개발 환경이 올바르게 설정되어 있다면 lefthook에 의해 commit message 형식은 자동으로 검사될 거에요.

#### Commit Message Format

각 commit message는 header와 body로 이루어져 있어요. Header는 type, scope, 그리고 subject로 이루어져 있어요.

```
<type>(<scope>): <subject>

<body>
```

Header는 commit message의 중심이며, `<scope>` 부분은 선택으로 포함하지 않아도 돼요.

각 줄은 100 글자를 넘어선 안됩니다. GitHub을 비롯한 각종 tool에서의 가독성을 높이기 위함이에요.

#### Type

- **feat**: 새로운 기능
- **fix**: 버그 수정
- **docs**: 문서화
- **style**: formatting, linting 등
- **refactor**
- **test**: 누락된 test 추가
- **chore**: 사소한 것, build 및 패키지 매니저 등 수정
- **revert**: 이전 commit 되돌리기

#### Scope

`<scope>`는 변경사항이 어느 요소에 영향을 미치는지 적습니다.
여러 요소에 영향을 미칠 경우 commit을 나누어 작성해야 해요.

- `fe` (frontend)
- `be` (backend)
- `infra`
- `iris`
- `deps` (dependencies)
- `ci` (continuous integration)
- `cd` (continuous deployment)

#### Subject

- `<subject>`는 변경사항을 요약하여 적습니다.
- 반드시 소문자로 시작하는 영문으로 작성합니다.
- 명령문을 사용합니다. ('change'(O), 'changed'(X), 'changes'(X))
- 마지막에 마침표를 붙이지 않습니다.

#### Message Body

한글 또는 영문으로 적으며, 무엇을 왜 구현했는지를 중심으로 가능한 자세히 설명합니다.

#### 예시

```
fix(fe): redirect authenticated user from login page to home

이미 로그인한 유저는 Log In 페이지에 접근해선 안된다.
Vue Router의 navigation guard를 이용해 redirect한다.
```

```
docs: add dev environment setup guide

Visual Studio Code와 GitPod에서 개발 환경을 세팅하는 방법을 문서화한다.
.devcontainer과 .gitpod.yml 등 설정 파일에 대한 설명을 덧붙인다.
```

## 3. Pull Request 생성 및 리뷰

각 pull request는 가능한 작은 단위로 작성해야 해요. 이말인 즉슨, pull request는 하나의 task에 대응하기 때문에 **issue와 연결될 task 생성은 작은 단위로 이뤄져야 해요.**

또한 하나의 pull request는 완전해야 해요.
즉, 테스트 코드를 포함해야 하고 완전하게 동작하며 CI를 통과해야 해요.
이는 `main` branch를 배포 가능한 상태로 유지하기 위함이에요.

Pull Request를 생성할 때는 다음 사항을 고려해주세요.

- 제목은 commit convention을 따라 작성해주세요. 하나의 pull request는 main branch에 하나의 commit으로 squash merge되기 때문이에요.
- Pull Request 내용에는 변경사항에 대한 설명을 자세히 적어주세요. 변경사항이 어떤 문제를 해결하는지, 왜 이렇게 구현했는지 등을 리뷰하는 사람이 쉽게 이해하게끔 적어주세요.
- Assignees와 Reviewers를 설정해주세요. Assignees는 해당 작업을 수행한 사람(본인 포함), Reviewers는 코드 리뷰를 담당할 사람을 설정해주세요.
- Reviewers로 팀장뿐만 아니라 팀원들도 설정해주세요. 팀장이 모든 코드를 리뷰하기에는 시간이 부족하기 때문에 팀원들이 서로 코드 리뷰를 하도록 유도해요.
- 정말 급한 상황이 아니라면 review를 부추기지 않도록 해요. Review를 부추긴다면 제대로 된 확인 없이 approve 되고, 원래 review의 의미가 퇴색될 수 있어요.
- Reviewer는 코드 리뷰를 완료하고 approve를 누르면, PR 작성자가 squash merge하도록 해요. 이때 merge 전에는 다시 한 번 코드를 확인해주세요.
- Close할 Notion task를 언급합니다. 이때, 형식은 `{Magic-word} TAS-{task ID}` 예: `closes TAS-517` 처럼 작성하여 Notion task와 Pull Request을 연결합니다. (`closes`가 아니더라도, 지원하는 Magic-word를 사용하면 됩니다. [노션 링크 참고](https://www.notion.so/ko-kr/help/github)). 
예를 들어, https://github.com/skkuding/codedang/pull/1929 을 확인하시면, PR 설명에 `closes TAS-517` 을 언급하였고, PR과 Notion task 간에 양방향 연결됩니다. PR이 닫히면 연결된 Notion task가 같이 닫히게 됩니다. 


::: tip Merge vs Rebase

코드당 프로젝트에서는 rebase보다 merge를 권장해요.
Rebase는 commit history를 깔끔하게 유지할 수 있지만, 코드를 잘못 작성했을 때 이전 commit을 수정하거나 commit을 삭제하는 등의 작업이 어려워요.
또한 rebase는 commit 작성 시간을 변경하기 때문에 훗날 추적이 어려워질 수 있어요.
Merge로 인해 commit history가 지저분해지는 문제는 `main` branch에 merge할 때 squash merge를 사용하여 해결할 수 있어요.

:::

## 4. 스테이지 환경 테스트 후 배포

Pull Request가 `main` branch에 merge되면, 자동으로 스테이지 환경에 배포됩니다.
스테이지 환경은 실제 서비스 환경과 유사하게 구성되어 있고, [https://stage.codedang.com](https://stage.codedang.com)에서 확인할 수 있어요. 더 자세한 내용은 [Staging vs Production](/dev/project/stage-server.md) 페이지를 참고해주세요.

### Production 배포 방법

기획 팀에서 스테이지 환경에서 테스트를 진행하고, 문제가 없다면 운영 환경에 배포됩니다.
배포는 어떤 팀원이든 trigger할 수 있어요.
배포를 진행할 때는 다음과 같은 절차를 따라주세요.

1. 코드당 GitHub repository에 접속해주세요.
2. 'Actions' 탭을 클릭해주세요.
3. 'CD - Production' workflow를 선택해주세요.
4. 'Run workflow' 버튼을 클릭해주세요. `main` branch를 선택하고 'Run workflow' 버튼을 클릭하면 배포가 진행됩니다.
5. **운영진의 승인이 필요해요.** 운영진 중 한 명이 배포를 승인하면 배포가 완료됩니다.

## 5. 모니터링 및 유지보수

배포가 완료되었다고 해서 끝나는 것이 아니라, 사용자가 사용하는 동안 지속적으로 모니터링하고 유지보수해야 해요.
이를 위해 코드당은 Grafana와 Sentry를 사용하고 있어요.

### Grafana

Grafana는 백엔드 모니터링 서비스로, 서버의 상태를 모니터링하고, 사용량 등을 확인할 수 있어요.

[https://grafana.codedang.com](https://grafana.codedang.com)에서 확인할 수 있어요.

### Sentry

Sentry는 프론트엔드 모니터링 서비스로, 에러 로그를 수집하고, 에러 발생 시 알림을 보내줘요.

[https://sentry.codedang.com](https://sentry.codedang.com)에서 확인할 수 있어요.
GitHub 스꾸딩 organization에 속해있다면 자동으로 권한이 부여돼요.
