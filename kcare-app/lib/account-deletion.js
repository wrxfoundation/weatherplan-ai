// 계정 삭제 — 무엇이 지워지고 무엇이 남는지 (2026-11-26 구글 플레이 준비).
// 이 글을 두 곳이 같이 쓴다:
//   · 내 정보 관리의 회원 탈퇴 안내 (pages/account.jsx — 로그인한 사람)
//   · 계정 삭제 안내 공개 화면 /delete-account (pages/delete-account.jsx — 로그인 없이)
// 구글 플레이는 계정을 만들 수 있는 앱에 '앱을 깔지 않고도 계정 삭제를 요청할 수 있는 웹 주소'를 요구한다
// (데이터 보안 양식의 '계정 삭제 URL'). 그 주소가 /delete-account 다. 주소를 바꾸면 Play Console 에 적은 값도 바꿔야 한다.
// 실제 동작은 pages/api/account.js (본인 탈퇴) · pages/api/members.js (관제 [삭제]) — 글이 동작과 달라지면 안 된다.
import { COMPANY, companyLines } from "./company";

const CS = `고객센터 ${COMPANY.tel}`;

// 탈퇴 안내 — 내 정보 관리에서 탈퇴 전에 보여 주는 줄 (어르신 · 보호자 / 직원)
export const LEAVE_LINES = {
  family: [
    "아이디 · 이름 · 연락처 · 비밀번호가 바로 지워지고, 이 아이디로 다시 로그인할 수 없습니다. 되돌릴 수 없습니다.",
    "가족이 함께 쓰는 기록(일정 · 요청 · 리포트 등)은 남은 가족과 서비스 제공을 위해 그대로 남습니다. 결제 기록은 법이 정한 기간 동안 보관합니다.",
    `월 구독(서비스 이용계약)은 탈퇴로 해지되지 않습니다. 해지는 ${CS}로 따로 신청해 주세요.`,
  ],
  staff: [
    "아이디 · 이름 · 연락처 · 비밀번호가 바로 지워지고, 이 아이디로 다시 로그인할 수 없습니다. 되돌릴 수 없습니다.",
    "맡고 있던 담당 · 업무 기록은 센터에 그대로 남고, 담당은 센터 관제가 다시 지정합니다.",
  ],
};

export const DELETE_ACCOUNT_PATH = "/delete-account";

// 공개 화면 본문 — components/LegalPage.jsx 가 약관과 같은 모양으로 그린다 (h · p · li · note, **굵게**)
export const ACCOUNT_DELETION = {
  id: "delete-account",
  title: "계정 삭제 안내",
  short: "계정 삭제 안내",
  path: DELETE_ACCOUNT_PATH,
  lead: "K-CARE 계정과 계정에 딸린 정보를 지우는 방법, 지워지는 것과 남는 것을 적었습니다.",
  draft: false,
  stamp: false, // 약관이 아니라 안내라 시행일 줄을 두지 않는다
  intro: `K-CARE는 **${COMPANY.name}**가 운영합니다. 계정은 앱(웹)에서 직접 지우거나, 로그인할 수 없으면 고객센터에 요청해 지울 수 있습니다. 앱을 지웠어도 아래 방법으로 요청할 수 있습니다.`,
  sections: [
    {
      h: "1. 직접 지우기 — 내 정보 관리",
      p: "로그인한 뒤 **내 정보 관리**에서 탈퇴하면 계정이 바로 지워집니다.",
      li: [
        {
          t: "순서",
          ol: true,
          sub: [
            `${COMPANY.site} 또는 K-CARE 앱에서 로그인합니다.`,
            "보호자는 **마이 › 멤버십 › 내 정보 관리**, 어르신은 **마이 › 내 정보 관리**를 엽니다. (주소: kcarelife.com/account)",
            "**회원 탈퇴 안내 보기**를 누르고, 비밀번호를 확인한 뒤 **탈퇴하기**를 누릅니다.",
          ],
        },
      ],
    },
    {
      h: "2. 로그인할 수 없을 때 — 고객센터에 요청",
      p: "아이디나 비밀번호를 잊었거나 앱을 지운 경우에도 삭제를 요청할 수 있습니다. 본인 확인 뒤 계정을 지웁니다.",
      li: [
        `전화: ${CS}`,
        COMPANY.email ? `전자우편: ${COMPANY.email} — 제목에 **계정 삭제 요청**이라고 적고, 이름과 아이디(또는 가입할 때 적은 휴대폰 번호)를 알려 주세요.` : null,
      ].filter(Boolean),
    },
    {
      h: "3. 지워지는 것",
      li: [
        "계정 정보 — 아이디 · 이름 · 연락처(휴대폰 번호) · 비밀번호(암호화해 둔 값) · 가입할 때 적은 내용",
        "센터가 적어 둔 내 연락 정보(보호자 기본정보)",
        "이 기기에 받아 둔 기록 사본",
      ],
    },
    {
      h: "4. 남는 것",
      li: [
        "**가족이 함께 쓰는 서비스 기록**(일정 · 요청 · 방문 리포트 등) — 남은 가족과 서비스 제공에 쓰는 기록이라 계정을 지워도 남습니다. 서비스 이용이 모두 끝난 뒤에는 이 기록의 삭제도 고객센터로 요청할 수 있습니다.",
        "**결제 기록** — 전자상거래법 등 관계 법령이 정한 기간 동안 보관한 뒤 지웁니다. 기간은 개인정보 처리방침 '3. 개인정보의 보유 및 이용 기간'에 적혀 있습니다.",
        "**탈퇴한 사실** — 권한 변경 기록에 이름 · 역할과 함께 한 줄 남습니다.",
        `**월 구독(서비스 이용계약)** — 계정을 지워도 해지되지 않습니다. 해지는 ${CS}로 따로 신청해 주세요.`,
      ],
    },
    {
      h: "5. 계정은 두고 일부 정보만 지우고 싶을 때",
      p: "계정을 그대로 둔 채 특정 정보의 정정 · 삭제를 원하시면 고객센터(전화 · 전자우편)로 요청해 주세요. 절차는 개인정보 처리방침 '5. 정보주체의 권리 및 행사 방법'과 같습니다.",
    },
    {
      h: "English summary — How to delete your K-CARE account",
      p: `K-CARE is operated by ${COMPANY.name}. You can delete your account in two ways.`,
      li: [
        "**In the app or on the web:** sign in, open **My page › My account (내 정보 관리)**, choose **회원 탈퇴 (Delete account)**, confirm your password. The account is deleted immediately.",
        `**Without signing in:** call ${COMPANY.tel}${COMPANY.email ? ` or e-mail ${COMPANY.email}` : ""} with your name and login ID. We delete the account after verifying your identity.`,
        "**Deleted:** login ID, name, phone number, password hash, sign-up details, and the contact details our staff recorded for you.",
        "**Kept:** care records shared by your family (schedules, requests, visit reports), which remain for the other family members and can be deleted on request once the service has ended; payment records, kept for the period required by Korean law; one audit line noting the deletion.",
      ],
    },
  ],
  foot: [COMPANY.name, ...companyLines(), CS].join(" · "),
};
