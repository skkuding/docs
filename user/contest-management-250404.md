# 대회 관리하기

본 Section에서는 대회를 관리하는 방법에 대해서 소개합니다.   
대회 관리는 Contest Admin 혹은 Contest Manager 권한을 가진 사용자만 가능합니다.    
권한을 얻을 수 있는 방법이 궁금하다면 [여기](https://docs.codedang.com/user/contest-role-250404.html#contest-admin-%E1%84%80%E1%85%AF%E1%86%AB%E1%84%92%E1%85%A1%E1%86%AB-%E1%84%92%E1%85%AC%E1%86%A8%E1%84%83%E1%85%B3%E1%86%A8-%E1%84%87%E1%85%A1%E1%86%BC%E1%84%87%E1%85%A5%E1%86%B8)를 클릭해주세요!    

---

## 대회 관리 화면 접근하기

### Management
대회 개최, 문제 출제 등의 모든 관리는 Management 페이지에서 가능해요.   
로그인 후, 화면 상단 우측에 있는 내 ID를 클릭하면 Management 페이지로 이동할 수 있는 메뉴가 나와요.   
![management](https://github.com/user-attachments/assets/eb0c6024-eb52-4761-acf6-9496ead5cd93)

### Contest List
기본적으로 대회는 Management 페이지의 Contest 메뉴에서 관리할 수 있어요.   
이 페이지에서는 내가 개최한 대회 혹은 내가 Contest Manager로 추가된 대회만 보여요.   
대회 이름 검색과 정렬은 페이지에 접근할 수 있다면 누구나 가능하지만, 대회 삭제는 해당 대회를 개최한 본인만 가능해요.   
![Contest Management](https://github.com/user-attachments/assets/c52d5bb4-997a-487b-93d1-f20fcf379395)

### Contest Detail
대회의 이름을 클릭하면 해당 대회의 자세한 정보를 볼 수 있어요.  
- Contest Admin : 이 대회를 만든 사람의 ID예요.
- Invitation Code : 이 대회의 참여 코드예요. 비공개 대회에서 사용할 수 있어요.
- 대회 기간을 볼 수 있어요.
- 시작 혹은 종료까지 남은 시간을 타이머로 볼 수 있어요.
![Contest Detail_TOP](https://github.com/user-attachments/assets/1a4280a4-bc84-40cc-8c55-3675fe240659)

---

## 대회 수정하기
![edit contest](https://github.com/user-attachments/assets/e8b08862-f6d5-4808-9a6c-407a452d4e43)
`Edit` 버튼을 클릭하면 대회의 기본 정보를 수정할 수 있어요.   
단, 대회 진행 중(Ongoing)에는 일부 정보만 수정 가능해요.

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
