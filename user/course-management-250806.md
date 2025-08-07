# 강의 관리하기

본 Section에서는 강의를 관리하는 방법에 대해서 소개합니다.   
강의 관리 및 삭제는 Instructor 권한을 가진 사용자만 가능합니다.    
권한을 얻을 수 있는 방법이 궁금하다면 [여기](https://docs.codedang.com/user/contest-role-250404.html#contest-admin-%E1%84%80%E1%85%AF%E1%86%AB%E1%84%92%E1%85%A1%E1%86%AB-%E1%84%92%E1%85%AC%E1%86%A8%E1%84%83%E1%85%B3%E1%86%A8-%E1%84%87%E1%85%A1%E1%86%BC%E1%84%87%E1%85%A5%E1%86%B8)를 클릭해주세요!    

---

## 강의 관리 화면 접근하기

### Management
강의 개설, 문제 출제 등의 모든 관리는 Management 페이지에서 가능해요.   
로그인 후, 화면 상단 우측에 있는 내 ID를 클릭하면 Management 페이지로 이동할 수 있는 메뉴가 나와요.   
![management](https://github.com/user-attachments/assets/eb0c6024-eb52-4761-acf6-9496ead5cd93)

### Course List
기본적으로 강의는 Management 페이지의 Course 메뉴에서 관리할 수 있어요.   
이 페이지에서는 내가 직접 개설한 강의 또는 Instructor 권한을 가지고 있는 강의만 보여요.   
![Contest Management](https://github.com/user-attachments/assets/c52d5bb4-997a-487b-93d1-f20fcf379395)  

강의 이름을 클릭하면 해당 강의의 참여자와 과제를 관리할 수 있어요.  
각 메뉴에 들어가서 자세히 살펴보아요.

## 강의 참여자 수정하기(Member)
강의에 참여 중인 계정들의 리스트를 확인할 수 있어요.  

### 참여자 추가
`Invite` 버튼을 클릭하면 새 계정을 추가할 수 있어요.  
![member_invite modal]  
새 계정을 추가하는 방법은 두 가지가 있어요:  
  - **Invite by Invitation Code**: 초대 코드를 이용하는 방법이에요.  
    스위치를 켜면 6자리의 초대 코드가 생성돼요.  
    초대하고자 하는 사용자가 Course 페이지의 `Register`  버튼을 눌러 해당 코드를 입력하면 강의에 참여할 수 있어요.  
    이때, 승인된 계정만 허용하도록 선택할 수 있어요.  
    현재 코드당은 `skku.edu`를 사용하는 이메일을 기준으로 하고 있지만, 화이트리스트를 업로드하여 다른 기준을 적용할 수도 있어요.  
  - **Invite Manually**: 사용자를 수동으로 추가하는 방법이에요.  
    초대하고자 하는 계정의 이메일을 검색한 후 `Invite` 버튼을 누르면 해당 사용자를 추가할 수 있어요.  

### 권한 변경  
각 계정의 Role을 클릭하면 해당 계정의 권한을 수정할 수 있어요.  
단, Instructor는 자신의 권한을 student로 변경할 수 없어요.  

## 과제 관리하기(Assignment)
강의에 사용되는 과제를 관리할 수 있어요.
![edit contest](https://github.com/user-attachments/assets/e8b08862-f6d5-4808-9a6c-407a452d4e43)

### 과제 생성
`Create` 버튼을 클릭하면 새로운 과제를 생성할 수 있어요!  
이제부터 입력 항목에 대해 알아볼게요. (*은 필수 항목이에요.)  
 1. **Title** *: 과제의 제목을 입력해요.  
    - 120자까지 입력할 수 있어요.  
 2. **Week** *: 과제를 몇 주차에 노출할지 선택해요.  
 3. **Start Time** *: 과제가 학생들에게 공개되는 일시를 설정해요.  
 4. **Due Time**: 과제의 제출 마감 기한을 설정해요. 마감 기한이 지나도 과제를 계속 열람할 수 있어요.  
 5. **End Time**: 과제의 종료 일시를 설정해요. 종료 일시가 지나면 과제를 더 이상 열람할 수 없어요.
 6. **Description**: 과제에 대한 설명을 입력해요.
     - 이미지, 30MB 이하의 파일, 표 등을 첨부할 수 있어요.
 7. **Problem List** *: `Import problem` 버튼을 클릭해 과제에 이용할 문제(Problem)를 불러올 수 있어요.  
    ![Import problem modal]
     - 현재는 코드당에서 생성된 문제만 불러올 수 있어요. 코드당에서 문제를 생성하는 방법을 알아보려면 [여기]를 클릭해주세요!  
     - 불러올 문제를 선택한 후 `Import` 버튼을 클릭하면 문제가 추가돼요.  
     - 과제를 생성하면 해당 문제는 더 이상 Problem에서 볼 수 없으니 주의해 주세요.  
    ![problem list]  
     - 문제를 다 추가했다면, 각 문제의 총점과 배열 순서를 정할 수 있어요.  
     - 해당 문제가 포함된 다른 과제를 보려면 상세 버튼을 클릭해주세요.  
  8. **Solution**: 해답이 있는 문제의 경우, 공개 여부를 선택할 수 있어요.  
     (문제 생성 또는 수정 페이지에서 해답을 추가할 수 있어요!)  
  9. 마지막으로 **히든 테스트케이스 결과 공개 여부**, **복사/붙여넣기 허용 여부**를 선택해요.
이제 과제를 생성할 준비를 모두 마쳤어요.
`Create` 버튼을 누르면 Assignment List에서 내 과제를 볼 수 있어요!😃

### 과제 수정
Assignment List에서 과제를 클릭하면 해당 과제의 정보를 열람하거나 수정할 수 있어요.  
과제 상세 페이지에서는 다음과 같은 정보를 확인할 수 있어요:  
1. **Information**: 과제에 대한 상세 설명, 포함된 문제, 설정 등을 볼 수 있어요.
   ![assignment information]
2. **Submission**: 학생들이 제출한 코드를 간단하게 확인할 수 있어요.
   ![assignment submission]
   - `All submissions` 탭에서는 모든 코드를 한꺼번에 볼 수 있어요. ![assignment/submission/all_submissions]
     각 항목을 클릭하면 원본 코드, 테스트케이스 결과 등 세부 정보를 확인할 수 있어요! ![assignment/submission/all_submissions/submission info]  
   - `Students` 탭에서는 제출 내역을 참여자별로 확인할 수 있어요. ![assignment/submission/students]
     각 항목을 클릭하면 참여자 및 참여자가 제출한 코드에 대한 정보를 볼 수 있어요! 이때 각 제출 ![assignment_submission student info]

### 대회 진행 중 수정 가능한 정보
- **End Time**    
  ※ 단, 기존 대회 종료 시각보다 빠른 시각으로 수정할 수 없어요.
- **Freeze start time**    
  ※ 단, 프리즈 시작 시각은 현재 시각 이후면서 기존 프리즈 시작 시각 이후여야 해요.

---

## 대회 운영하기

대회를 진행하면서 참여자들의 제출 내역을 열람하거나, 공지사항을 등록할 수 있어요.    
각 탭의 역할을 알아봐요.

### 리더보드 열람 (Leaderboard)
![leaderboard-admin](https://github.com/user-attachments/assets/9521fe1b-634a-492d-a432-7020c6b97219)
프리즈를 설정했을 경우, 프리즈 해제를 수동으로 설정할 수 있어요.
  - 프리즈에 대한 자세한 설명은 [여기](https://docs.codedang.com/user/contest-leaderboard-250404.html#%E1%84%85%E1%85%B5%E1%84%83%E1%85%A5%E1%84%87%E1%85%A9%E1%84%83%E1%85%B3%E1%84%8B%E1%85%B4-%E1%84%91%E1%85%B3%E1%84%85%E1%85%B5%E1%84%8C%E1%85%B3-freeze)를 확인해주세요!

Contest Admin과 Contest Manager는 프리즈에 관계 없이 전체 리더보드를 열람할 수 있어요.
  - 참여자 수는 `1번 이상 제출한 사람/대회에 등록한 사람`으로 구분되어서 보여요.
  - 최신 리더보드로 업데이트하기 위해서는 브라우저 새로고침이 필요해요.

### 제출 내역 열람 (All Submission)
![all-submission](https://github.com/user-attachments/assets/5f86b439-c3be-402b-8d9e-f261addb63fb)
해당 대회에 제출된 내역을 모두 열람할 수 있어요.    

![submission detail](https://github.com/user-attachments/assets/91e2e487-fa86-4860-9b95-5f7cd464265d)
제출 내역을 클릭하면 테스트케이스 결과, 소스 코드 등 세부 정보를 볼 수 있어요.    
예상 결과값과 실제 출력값 등의 자세한 제출 결과를 보고 싶다면 화살표를 눌러 더 자세한 정보를 볼 수 있어요.    

### 공지사항 등록 (Adnnouncement)
![announcement](https://github.com/user-attachments/assets/c320d005-4efa-4e81-871f-d910326a59ce)
대회 진행 중 문제 변경, 리더보드 프리즈 등 변경 사항이 생겼다면 해당 대회에 공지사항을 등록할 수 있어요.   

![announcement-2](https://github.com/user-attachments/assets/d4e129b9-bdf7-4a1a-b396-c3c167013c0a)
공지사항의 내용에 해당하는 문제를 단일 선택할 수 있어요.    
공지사항은 수정하거나 삭제할 수 없으니, 올리기 전 반드시 내용을 검토해 주세요!

---

Statistics(대회 통계)와 Q&A 기능은 빠른 시일 내에 지원할 예정이에요.   
조금만 기다려주세요!
