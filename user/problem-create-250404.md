# 문제 생성하기

본 Section에서는 문제 생성 기능에 대해서 소개합니다.

코드당에서는 문제를 직접 생성하거나, 엑셀 파일을 이용해 여러 문제를 한꺼번에 업로드할 수 있어요.
두 방법을 아래에서 상세하게 소개할게요.

## 문제 직접 생성하기

Management 페이지의 왼쪽에 있는 `Problem` 버튼을 클릭하면 문제 관리 페이지에 접속할 수 있어요.
![problem-list](https://github.com/user-attachments/assets/86e105ee-a4b0-445c-8e96-bc086c5154e8)

오른쪽 상단의 `+ Create` 버튼을 클릭하면 문제 생성 페이지로 이동할 수 있어요.


### 문제 기본 정보 작성하기

먼저 문제에 대한 기본 정보를 작성해주세요. (*은 필수 입력 항목이에요.)

![create-problem-1](https://github.com/user-attachments/assets/d3cacabb-c23e-4ca3-9e12-f457a8c08773)

1. **`Title`** * : 문제의 이름을 입력해주세요. 최대 200자까지 입력할 수 있어요.
2. **`Visible`** * : 코드당의 Problem 탭에 문제를 노출할지 말지 결정해요. Visible이 활성화되면 문제가 모두에게 공개되어요.
3. **`Info`** : Language와 Level로 이루어져 있어요.
   - `Language` * : 사용자가 풀 수 있는 언어를 선택해요. 현재 C, C++, Python3, Java를 지원하고, 다중 선택이 가능해요.
   - `Level` * : 문제의 난이도를 설정해요. Level 1~5 중에 선택해주세요.
4. **`Description`** * : 문제에 대한 정보를 작성해주세요. 수식, 사진 첨부를 지원해요. 
5. **`Input Description`** * : Testcase Input에 대한 설명을 입력해 주세요. 예를 들어, `첫째 줄에 A와 B가 주어진다. (0 < A, B < 10)`와 같이 작성할 수 있어요.
6. **`Output Description`** * : Testcase Output에 대한 설명을 입력해 주세요. 예를 들어, `첫째 줄에 A+B를 출력한다.`와 같이 작성할 수 있어요.


### 문제 Testcase 정보 작성

다음으로 채점에 사용될 Testcase를 설정해주세요.

![create-problem-2](https://github.com/user-attachments/assets/cbc052fb-4e96-400c-9603-f4b6cfc5c3bd)

문제의 Testcase는 Sample Testcase 또는 Hidden Testcase로 설정할 수 있어요.

모든 Testcase는 채점에 사용되고 채점 결과가 공개되지만, 
Sample Testcase의 **Input/Output은 사용자에게 공개**되고, Hidden Testcase는 공개되지 않아요.
(대회에 속한 문제의 경우 **채점 결과를 비공개**할 수 있어요. 자세한 것은 대회 생성하기 섹션을 참고해주세요.)

모든 Testcase의 <strong>배점 합계는 100%</strong>가 되어야 해요. 각 배점을 직접 설정하거나 `Equal Distribution` 버튼을 통해 일괄적으로 배점을 설정할 수 있어요.

Testcase 정책을 정리하면 다음과 같아요. (User Testcase는 사용자가 코드를 실행할 때 일시적으로 추가하는 테스트케이스로, 관리자가 설정하지 않아요.)
| | Input/Output 노출 여부	| Test 버튼 클릭 시	| Submit 버튼 클릭 시 |
| --| -- | -- | -- |
| Sample Testcase |	노출됨	| 채점됨 + 채점 결과 노출	| 채점됨 + 대회 생성 시 채점 결과 노출 여부 결정
| Hidden Testcase	| 노출되지 않음	| 채점하지 않음	| 채점됨 + 대회 생성 시 채점 결과 노출 여부 결정
| User Testcase  	| 사용자가 추가	| 채점됨 + 채점 결과 노출	| 채점되지 않음


### 문제 기타 정보 작성
마지막으로 필요한 경우 `Hint`, `Source`를 작성할 수 있어요.

![image 4](https://github.com/user-attachments/assets/f4545944-37ed-40d9-bbf4-329dc8336ded)

`Hint`는 문제를 풀 때 도움이 되는 힌트를 제공할 수 있어요. 사용자 페이지에서 사용자는 토글을 눌러서 힌트를 열 수 있어요.

`Source`는 문제의 원본 소스를 말해요. 대회 출처나 저작권자를 작성할 수 있어요.

`Preview`를 클릭하면 만든 문제를 IDE 화면에서 미리 볼 수 있어요.   
`Exit Preview`를 클릭하면 다시 Create Problem 화면으로 돌아가요.
![problem-preview](https://github.com/user-attachments/assets/af57b82b-f287-4841-8ba2-b2b5bfa8ece0)

마지막으로 **`Submit`** 버튼을 누르면 문제 생성이 완료됩니다.

## 문제 파일로 업로드

여러 개의 문제를 한번에 올리는 경우에는 문제 정보를 파일로 업로드해서 문제를 생성할 수 있어요.

Problem 페이지에서 `Upload` 버튼을 클릭하면 문제 업로드 모달이 나오게 되어요.

Sample Excel 파일을 다운로드하여 문제 정보를 수정한 후 업로드해 주세요.

![image](https://github.com/user-attachments/assets/933e17e4-be42-4c17-9bba-387d207c2faf)

예를 들어, Sample Excel 파일을 그대로 업로드하면,
![image](https://github.com/user-attachments/assets/006b1533-db0a-442a-ba95-9d7538081b45)

다음과 같이 두 문제가 생성됩니다.
![image](https://github.com/user-attachments/assets/b64bbfe5-7731-4b77-9c46-d670ca4768b6)
