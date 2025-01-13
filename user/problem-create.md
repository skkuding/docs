# 문제 생성하기

본 Section에서는 문제 생성 기능에 대해서 소개해요.

코드당에서는 문제를 직접 만들 수도 있고, 엑셀 파일로 여러 개의 문제를 한번에 올릴 수도 있어요. 

두 방법을 아래에서 자세히 소개할게요.

## 문제 직접 만들기
![image](https://github.com/user-attachments/assets/56c49c76-cbbf-4916-8acb-0172242d4637)

Management 페이지에서 좌측 Problem 버튼을 클릭하면 Problem 페이지에 접속할 수 있어요.

여기서 <code> + Create </code> 버튼을 클릭하여 문제 생성 페이지에 진입할 수 있어요. 

![image](https://github.com/user-attachments/assets/09380b6d-00df-4de5-9b1f-14943c227ae3)

먼저, Title, Info, Description, Input/Output Description 등 문제에 대한 기본 정보를 작성해주세요.

![image](https://github.com/user-attachments/assets/50a7b215-76a1-4d68-b2f0-87c3b4da1299)

다음으로 채점에 사용될 Testcase와 시간/메모리 제한을 설정해주세요. 


문제의 Testcase는 Sample Testcase 또는 Hidden Testcase로 설정할 수 있어요.

모든 Testcase는 채점에 사용되고 채점 결과가 공개되지만, 
Sample Testcase의 Input/Output은 사용자에게 공개되고 Hidden Testcase는 공개되지 않아요.

모든 Testcase 배점의 합은 100%가 되어야해요. 각 배점을 직접 설정하거나 `Equal Distribution` 버튼을 통해 일괄적으로 배점을 설정할 수 있어요.

Testcase 정책을 정리하면 다음과 같아요.
| | Input/Output 노출 여부	| Test 버튼 클릭 시	| Submit 버튼 클릭 시 |
| --| -- | -- | -- |
| Sample Testcase |	노출됨	| 채점됨 + 채점 결과 노출	| 채점됨 + 대회 생성 시 채점 결과 노출 여부 결정
| Hidden Testcase	| 노출되지 않음	| 채점하지 않음	| 채점됨 + 대회 생성 시 채점 결과 노출 여부 결정
| User Testcase  	| 사용자가 추가	| 채점됨 + 채점 결과 노출	| 채점되지 않음

Hint나 Source 정보는 필요한 경우 추가해주시고, Submit 버튼을 누르면 문제 생성이 완료되어요.

## 문제 업로드 하기

문제를 여러 개 한번에 올리는 경우에는 문제 정보를 업로드해서 문제를 생성할 수 있어요.

![image](https://github.com/user-attachments/assets/933e17e4-be42-4c17-9bba-387d207c2faf)

Problem 페이지에서 여기서 <code> Upload </code> 버튼을 클릭하면 문제 업로드 모달이 나옵니다.

Sample Excel 파일을 다운로드 받아 문제 정보를 모두 수정한 뒤에, 파일을 업로드해주세요.

예를 들어 Sample Excel 파일을 그대로 업로드하면,
![image](https://github.com/user-attachments/assets/006b1533-db0a-442a-ba95-9d7538081b45)

다음과 같이 두 문제가 생성되게 됩니다.
![image](https://github.com/user-attachments/assets/b64bbfe5-7731-4b77-9c46-d670ca4768b6)


