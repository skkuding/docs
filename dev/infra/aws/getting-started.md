# Getting Started with AWS

코드당은 대부분의 컴퓨팅 리소스를 On-premise 서버에서 쿠버네티스로 운영하고 있지만, 데이터베이스와 storage 등 일부 서비스는 AWS를 사용하고 있습니다.
버전 관리와 Pull Request 등 IaC의 장점을 살리기 위해, 모든 AWS 리소스는 Terraform으로 관리하고 있습니다.

## Creating an AWS Account

코드당의 AWS 리소스에 접근하기 위해서는 IAM 사용자를 생성해야 합니다.
새로 IAM 사용자를 생성하려는 분은 기존 IAM 사용자에게 요청하여 계정을 생성해주세요.

아래 과정은 기존 IAM 사용자가 새로운 사용자를 생성하는 과정입니다.

1. AWS Management Console에 기존 IAM 사용자로 로그인합니다.
2. 서비스 목록에서 "IAM"을 검색하여 IAM 대시보드로 이동합니다.
3. 왼쪽 사이드바에서 "Users"를 클릭합니다.
4. "Create user" 버튼을 클릭합니다.
5. 희망하는 사용자 이름을 입력합니다. 스꾸딩 내에서만 사용되기 때문에 자유롭게 설정해도 됩니다.
6. "Provide user access to the AWS Management Console" 옵션을 선택합니다. 이후 "Next"를 클릭합니다.
7. "Add user to group" 옵션에서 "skkuding-member" 그룹을 선택합니다. 이후 "Next"를 클릭합니다.
8. 내용을 확인한 후 "Create user" 버튼을 클릭합니다.

::: warning
로그인한 후 비밀번호를 변경하고, 반드시 MFA(Multi-Factor Authentication)를 설정해주세요.
AWS 계정은 해킹 위험이 높기 때문에, MFA 설정은 필수입니다.

IAM 대시보드에서 생성한 사용자를 클릭한 후 "Security credentials" 탭에서 "Assign MFA device" 버튼을 클릭하여 MFA를 설정할 수 있습니다.
:::

## Setting Up AWS CLI

Terraform을 사용하려면 AWS CLI를 설치하고, 로컬 환경에 인증 정보를 설정해야 합니다.
뿐만 아니라 AWS CLI는 다양한 AWS 리소스를 관리하는 데 유용하게 사용될 수 있습니다.

### 1. Install AWS CLI

아래 공식 문서를 참고하여 AWS CLI를 설치해주세요.

https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/getting-started-install.html

### 2. Create IAM Access Key

AWS Management Console에서 IAM 대시보드로 이동한 후, 왼쪽 사이드바에서 "Users"를 클릭합니다.

생성한 사용자를 클릭한 후 "Security credentials" 탭에서 "Create access key" 버튼을 클릭하여 Access Key ID와 Secret Access Key를 생성합니다.

Use Case로 "Command line interface (CLI)"를 선택하고, "Next"를 클릭합니다.

이후 원하는 Description을 입력하고 "Create access key" 버튼을 클릭합니다.

생성된 Access Key ID와 Secret Access Key를 안전한 곳에 저장합니다.

### 3. Configure AWS CLI

AWS CLI를 설치한 후, 아래 명령어를 실행하여 인증 정보를 설정합니다.
다른 인증 정보와 혼동되지 않도록 `--profile skkuding` 옵션을 추가하는 것을 권장합니다.

```bash
aws configure --profile skkuding
```

- AWS Access Key ID: 생성한 Access Key ID를 입력합니다.
- AWS Secret Access Key: 생성한 Secret Access Key를 입력합니다.
- Default region name: `ap-northeast-2`를 입력합니다.
- Default output format: Enter를 눌러 기본값을 사용합니다.

이제 `aws s3 ls --profile skkuding` 명령어를 실행하여 잘 설정되었는지 확인할 수 있습니다.

```
❯ aws s3 ls --profile skkuding
2024-11-28 02:08:10 codedang-media
2024-11-13 00:02:10 codedang-testcase
2024-11-13 00:02:10 codedang-tf-state
```

::: tip
`--profile skkuding` 옵션을 매번 입력하는 대신, `AWS_PROFILE` 환경 변수를 설정할 수 있습니다.

이는 코드당 repository 설정이 잘 되어있다면 direnv가 자동으로 코드당 폴더 안에서 `AWS_PROFILE=skkuding` 환경 변수를 설정해줍니다.

만약 코드당 repository 안에서 `AWS_PROFILE` 환경 변수가 설정되지 않는다면, `scripts/setup.sh` 스크립트를 실행하여 설정할 수 있습니다.
:::
