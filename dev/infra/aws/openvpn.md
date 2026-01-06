# OpenVPN

AWS VPC와 On-premise 네트워크 간의 안전한 통신을 위해 OpenVPN을 사용하고 있습니다.

## How to Connect

### 1. OpenVPN Profile 불러오기

AWS Secrets Manager에 저장된 OpenVPN 프로필을 다운로드합니다.
AWS CLI를 사용하여 아래 명령어를 실행합니다. (예: skkuding.ovpn에 저장)
```bash
aws secretsmanager get-secret-value --secret-id "Codedang-OpenVPN-Profile" --output text --query SecretString > skkuding.ovpn
```

만약 환경 변수에서 `AWS_PROFILE` 환경 변수를 설정해 두지 않았다면, `--profile skkuding` 옵션을 같이 입력해주어야 합니다. ([Getting Started with AWS 페이지 참고](./getting-started.md))

```bash
aws secretsmanager get-secret-value --secret-id "Codedang-OpenVPN-Profile" --output text --query SecretString --profile skkuding > skkuding.ovpn
```


### 2. OpenVPN Client 설치

OpenVPN 클라이언트를 설치합니다. 아래 공식 홈페이지를 참고하여 설치해주세요.

https://openvpn.net/client/

### 3. OpenVPN 접속

OpenVPN 클라이언트를 실행한 후, 다운로드한 OpenVPN 프로필(skkuding.ovpn)을 불러옵니다.
