# 리더보드

본 Section에서는 대회의 리더보드에 대해 설명합니다.   
리더보드는 대회 참여자들의 순위, 제출수, 패널티 점수 등을 보여주는 기능을 의미합니다.

## 점수와 순위

코드당에서 개최되는 대회는 아래와 같은 방법으로만 순위 선정이 가능해요.   
빠른 시일 내에 더 많은 순위 선정 방식을 지원할게요!

1. **Accepted(정답)한 문제**가 많을 수록 높은 순위를 차지해요.
   - 모든 문제는 부분 점수를 인정하지 않아요. 정답과 오답으로만 결과를 구분해요.
   - 가장 먼저 문제를 푼 사람 등에 대하여 가산점을 부여하지 않아요.
2. Accepted한 문제 수가 같으면 **패널티 점수** 가 적을 수록 높은 순위를 차지해요.
   - 패널티 점수는 아래와 같이 계산해요.
   - `대회 시작부터 Accepted까지 걸린 시간(분 단위) + (제출 수 - 1) * 20`
   - 오답인 문제에 대해서는 패널티 점수를 계산하지 않아요.
   - 아래는 패널티 점수의 계산 예시예요.
   ![rank_example](https://github.com/user-attachments/assets/9e0a38a6-cea4-4ed9-a46d-d08b0e3bd735)
3. Accepted한 문제의 수와 패널티 점수가 모두 같다면, 둘 중 Accepted한 소스 코드를 먼저 제출한 사람이 더 높은 순위를 차지해요.

## 리더보드의 구성

![Leaderboard](https://github.com/user-attachments/assets/7e8dc216-60e4-4a55-8f6b-469d031b40dc)

리더보드는 특정한 대회의 페이지 안에 있는 **Leaderboard** 탭을 클릭하면 볼 수 있어요.   
대회가 끝난 후에는 대회 참여자가 아니어도 누구나 리더보드를 볼 수 있어요.

리더보드는 아래와 같이 구성되어 있어요.
![Leaderboard Modal](https://github.com/user-attachments/assets/3edaa4dd-ccd8-46dc-9b66-764059450d29)

## 리더보드의 프리즈(Freeze)

![Leaderboard_Freeze](https://github.com/user-attachments/assets/9a4a58a6-db16-4cf2-af37-d8ba90b0ef99)

프리즈는 대회 종료 n분 전부터 리더보드에서 참여자들의 제출 수, 정답 여부, 패널티 점수 등을 비공개 하는 기능을 의미해요.  
  - 리더보드가 프리즈되면 일반 사용자들은 일부 제출 내역의 결과를 리더보드에서 볼 수 없어요.   
  - 단, 해당 대회의 Contest Admin과 Contest Manager는 프리즈에 관계 없이 언제나 참여자들의 결과를 리더보드에서 확인할 수 있어요.   
    (Management > Contest > [해당 대회 이름] > Leaderboard에서 확인해주세요!)    

리더보드 프리즈가 해제되면 누구든지 모든 제출 결과를 볼 수 있어요.   
  - 프리즈 이전과 순위, 전체 패널티 점수 등이 달라질 수 있어요.   
  - 프리즈가 해제된 이후의 순위가 대회의 최종 순위예요.   

### 설정 방법

![Set Freeze](https://github.com/user-attachments/assets/cef0d9df-0f28-41b5-ad62-4f7527361c96) 
(해당 페이지는 Contest Admin만 접근 가능해요.)    
Management > Contest > [해당 대회 이름] > Create Contest에서 프리즈 사용 여부와 프리즈 시작 시각을 설정할 수 있어요.   
프리즈 시작 시각은 대회 종료 시각을 기준으로 90분 전, 75분 전, 60분 전, 45분 전, 30분 전, 15분 전 중에서 선택할 수 있어요.   

### 해제 방법 
![unfreeze](https://github.com/user-attachments/assets/7c038af9-7061-4296-808d-7a04880d3dd9)   
(해당 페이지는 Contest Admin과 Contest Manager만 접근 가능해요.)    
리더보드는 대회 종료 즉시 프리즈가 해제되지 않아요.   
대회 종료 이후 직접 프리즈를 해제해주세요!   
  - Management > Contest > [해당 대회 이름] > Leaderboard에서 스위치를 켜면 프리즈가 즉시 해제돼요.   
  - 대회가 종료되기 전에는 프리즈를 해제할 수 없어요.   
