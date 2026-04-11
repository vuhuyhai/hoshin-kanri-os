export interface HKStep {
  num: string
  title: string
  body: string
  tool: string
  full?: boolean
}

export interface HKPhase {
  num: string
  jp: string
  title: string
  desc: string
  timing: string
  who: string
  badge: string
  color: string
  steps: HKStep[]
  ladysfit: string
  warn?: string
  quote?: { text: string; source: string }
}

export const PHASES: HKPhase[] = [
  {
    num: '01', jp: 'スキャン · SCAN', title: 'SCAN — ĐÁNH GIÁ THỰC TRẠNG & ĐỊNH HƯỚNG',
    desc: 'Trước khi lên kế hoạch, phải hiểu thực tế đang ở đâu và muốn đi về đâu. Giai đoạn này là nền tảng — nếu bỏ qua, toàn bộ HK bên dưới sẽ bị sai hướng.',
    timing: '⏱ Tháng 10–11 (năm trước)', who: '👥 CEO + Ban lãnh đạo', badge: 'TIỀN ĐỀ BẮT BUỘC', color: '#1a5fa8',
    steps: [
      { num: '1.1', title: 'Làm rõ Mission, Vision & Long-term Strategy',
        body: 'Trả lời 3 câu hỏi nền tảng: **Mission** — tổ chức tồn tại để làm gì? **Vision** — hình ảnh lý tưởng của tổ chức trong tương lai trông như thế nào? **Strategy** — sẽ đạt vision đó bằng con đường nào?\n\nĐây không phải bài tập viết lại câu khẩu hiệu. Ban lãnh đạo phải thực sự đồng thuận về nghĩa của từng câu — vì bất đồng ngầm ở đây sẽ bùng phát thành xung đột khi Catchball bắt đầu.',
        tool: 'Phiên họp leadership retreat · Poster lớn dán tường' },
      { num: '1.2', title: 'Phân tích Current State (Thực trạng hiện tại)',
        body: 'Vẽ bức tranh trung thực về tổ chức ngày hôm nay: điểm mạnh, điểm yếu, cơ hội, rủi ro — có số liệu cụ thể, không phải cảm tính. Kesterson dùng diagram 4 góc phân tích thực trạng và **buộc phải lượng hóa** ("cholesterol 280" thay vì "sức khỏe kém").\n\nKhông phân tích đủ Current State = không biết gap thực sự là gì = không thể đặt breakthrough đúng.',
        tool: 'Porter Matrix · Product/Market Matrix · Value Stream Map' },
      { num: '1.3', title: 'Xác định Desired Future State (3–5 năm)',
        body: 'Từ Vision dài hạn, xác định **tổ chức sẽ trông như thế nào ở một thời điểm cụ thể** (ví dụ: 3 năm tới). Không mơ hồ — phải có chỉ số đo được. Melander gọi đây là "Target Condition."\n\nPhân biệt: Vision là ảnh lý tưởng (có thể không bao giờ đạt), Target Condition là trạm dừng cụ thể trên hành trình đó.',
        tool: 'Visionary A3 · Target Condition Workshop' },
      { num: '1.4', title: 'Identify the Gaps — Phân tích khoảng cách',
        body: 'So sánh Current State và Desired Future State để tìm **gaps** — những thứ phải thay đổi. Liệt kê tất cả, sau đó hỏi: gap nào có tính hệ thống nhất? Gap nào là nguyên nhân gốc rễ của nhiều gap khác?\n\nJackson khuyến cáo dùng **Interrelationship Digraph (ID)** để tìm mũi tên đi vào nhiều nhất — đó là root cause thực sự.',
        tool: 'Gap Analysis Worksheet · Interrelationship Digraph (ID)' },
    ],
    quote: { text: '"Knowing your competitors and their capabilities… knowing your customers and the social and technological trends that influence how they live and what they want to buy."', source: '— Thomas Jackson, Hoshin Kanri for the Lean Enterprise, Ch.2' },
    ladysfit: '**1.1:** Mission của Ladysfit có thể là "giúp phụ nữ Việt Nam giảm béo bền vững" — nhưng toàn bộ 30+ franchise owner có hiểu và đồng thuận về chữ "bền vững" không? Tổ chức một buổi leadership retreat để kiểm tra.\n\n**1.2:** Current State cần số liệu thực: retention rate trung bình, NPS của member, doanh thu / franchise / tháng, tỷ lệ franchise đang lời / lỗ, trainer quality score.\n\n**1.4:** Gap thường gặp nhất ở fitness franchise: trainer quality không đồng đều → member experience không nhất quán → retention thấp. Đây là root cause, không phải "marketing yếu."',
  },
  {
    num: '02', jp: 'プラン · PLAN', title: 'PLAN — LẬP KẾ HOẠCH & TRIỂN KHAI XUỐNG (CATCHBALL)',
    desc: 'Từ gaps đã xác định, chọn Breakthrough Objectives cho năm nay. Sau đó negotiate xuống toàn tổ chức qua Catchball — để mỗi tầng đều sở hữu mục tiêu, không chỉ nhận lệnh.',
    timing: '⏱ Tháng 11–12 (năm trước)', who: '👥 CEO → All levels', badge: 'QUAN TRỌNG NHẤT', color: '#1e7a3c',
    steps: [
      { num: '2.1', title: 'Xác định Breakthrough Objectives — Tối đa 3–5',
        body: 'Từ danh sách gaps, chọn những mục tiêu đột phá quan trọng nhất cho năm. Quy tắc cứng: **không bao giờ quá 5, lý tưởng là 3.**\n\nMelander trích dẫn Mark DeLuzio: "The hardest thing to do with Hoshin is not figuring out what you\'re going to do — it\'s agreeing on what you are NOT going to do."\n\nBẫy phổ biến nhất: chọn objectives theo cơ cấu phòng ban ("mỗi bộ phận 1 objective") — đây là công thức thất bại vì không tạo ra sự hợp tác liên phòng.',
        tool: 'Affinity Diagram · ID · Priority Matrix (Important vs Urgent)' },
      { num: '2.2', title: 'Catchball Round 1 — CEO → Management Team',
        body: 'CEO đề xuất 1-year objective và **tung bóng** xuống cho ban quản lý. Mỗi manager nhận bóng phải trả lời 4 câu hỏi: (1) CEO thực sự muốn gì? (2) Bộ phận tôi có thể làm được gì? (3) Môi trường bên ngoài ảnh hưởng thế nào? (4) Bài học từ thực tế của bộ phận tôi?\n\nSau đó **tung bóng ngược lại** với đề xuất cụ thể. Đây không phải báo cáo — đây là negotiate thực sự.',
        tool: 'Catchball Meeting · A3 Template · Sticky Notes Wall' },
      { num: '2.3', title: 'Catchball Rounds 2–N — Cascade xuống các tầng',
        body: 'Quá trình Catchball tiếp tục xuống các tầng: Manager → Team Leader → Individual Contributor. Mỗi tầng nhận objective từ tầng trên, phân tích, negotiate, rồi đề xuất **means** (cách thực hiện) và **measures** (chỉ số đo lường) của tầng mình.\n\nJackson mô tả 5 rounds Catchball cụ thể: từ Hoshin Experiments (strategic) → Tactical Projects → Operational Projects → Action Plans → Finalization.',
        tool: 'X-Matrix · A3 · Policy Deployment Chart' },
      { num: '2.4', title: 'Nemawashi — Xây đồng thuận song song',
        body: 'Song song với Catchball vertical, cần Nemawashi horizontal: thảo luận không chính thức với các bên liên quan **trước** khi có quyết định chính thức. Villalba-Diez và Melander đều nhấn mạnh đây là yếu tố Nhật Bản quan trọng nhất thường bị bỏ qua khi phương Tây áp dụng HK.\n\nMục tiêu: không ai bị bất ngờ trong cuộc họp chính thức. Mọi "no" lớn đã được xử lý trước đó rồi.',
        tool: '1-1 meetings · Cross-functional workshops · Pre-meeting briefings' },
      { num: '2.5', title: 'Xây dựng X-Matrix — Kết nối tất cả lại',
        body: 'X-Matrix là công cụ visual kết nối 4 tầng: **Long-term strategies** (3–5 năm) → **Annual objectives** → **Improvement priorities** → **Metrics / Targets**. Mỗi ô giao nhau cho thấy mức độ liên kết (strong / weak / none).\n\nMục tiêu: nhìn vào X-Matrix, bất kỳ ai cũng thấy ngay "việc tôi đang làm có kết nối với strategy nào?" Nếu không, đó là việc không nên làm.',
        tool: 'X-Matrix template (A1 hoặc A0) · Hoshin Kanri Tree (Villalba-Diez)' },
      { num: '2.6', title: 'Finalize Plans — Bowling Chart & Action Plans',
        body: 'Sau khi X-Matrix được đồng thuận, chuyển thành **Bowling Chart** (biểu đồ theo dõi progress theo tháng — target vs actual) và **Action Plans** chi tiết cho từng team.\n\nMỗi action plan cần: owner rõ ràng, deadline cụ thể, chỉ số đo lường có thể kiểm tra. Kesterson nhấn mạnh: "If you can\'t measure it, you can\'t manage it" — nhưng đừng đo quá nhiều chỉ số (3–5 KPI mỗi objective là đủ).',
        tool: 'Bowling Chart · A3 Action Plans · Management Board' },
    ],
    warn: '**Function-based objectives:** Khi mỗi phòng ban tự nhận 1 objective của mình — không ai phải hợp tác — không có gì thay đổi thực sự. Melander gọi đây là "công thức thất bại." Objectives đúng phải buộc các bộ phận phải làm việc với nhau.',
    ladysfit: '**Catchball thực tế:** CEO (Vũ Hải) đề xuất objective: "Tăng retention rate hệ thống từ X% lên Y% trong năm." Từng franchise owner nhận bóng và trả lời: "Franchise của tôi có thể cải thiện bao nhiêu? Chúng tôi cần hỗ trợ gì từ trung tâm?"\n\n**X-Matrix đơn giản cho SME:** Không cần form phức tạp — dùng bảng Excel 4 cột: Strategy → Objective năm nay → Project/Action → Chỉ số đo. Print ra A3, dán lên bảng phòng họp.',
  },
  {
    num: '03', jp: 'ドゥ · DO', title: 'DO — THỰC THI & DUY TRÌ TIÊU CHUẨN',
    desc: 'Kế hoạch chuyển thành hành động thực tế. Giai đoạn này không phải "làm theo kế hoạch" đơn thuần — mà là thực thi trong khi liên tục học hỏi và standardize.',
    timing: '⏱ Tháng 1–9 (cả năm)', who: '👥 Tất cả cấp', badge: 'THỰC CHIẾN', color: '#E07825',
    steps: [
      { num: '3.1', title: 'Kick-off — Truyền thông kế hoạch toàn tổ chức',
        body: 'Sau khi Catchball hoàn tất, **công bố chính thức** objectives và plans của năm cho toàn tổ chức. Mỗi người phải biết: (1) năm nay tổ chức đang tập trung vào gì, (2) bộ phận tôi đóng góp vào objective nào, (3) tôi cá nhân làm gì.\n\nJackson nhấn mạnh: "Develop leaders who can teach" — mỗi manager phải có khả năng giải thích kế hoạch cho team bằng lời mình, không đọc slide.',
        tool: 'All-hands meeting · Team briefings · Visual boards tại từng bộ phận' },
      { num: '3.2', title: 'Setup Visual Management — Làm cho tiến độ nhìn thấy được',
        body: 'Thiết lập **Management Board** tại mỗi bộ phận hiển thị: objectives, actual vs target theo tuần/tháng, vấn đề đang xử lý, ai đang làm gì. Villalba-Diez gọi đây là "見える化" (mieruka) — visualize để mọi người nhìn thấy vấn đề thay vì che giấu.\n\nBoard phải được cập nhật theo nhịp thực tế (weekly), không phải chỉ cập nhật khi có sếp đến kiểm tra.',
        tool: 'Bowling Chart · Kanban Board · A3-R (Review) form' },
      { num: '3.3', title: 'Daily & Weekly Routines — Nhịp điều hành',
        body: 'HK không sống được nếu chỉ kiểm tra mỗi quý. Cần thiết lập nhịp điều hành đều đặn:\n**Daily standup** (5–10 phút): hôm qua làm được gì, hôm nay làm gì, có vướng mắc gì không?\n**Weekly review**: tiến độ vs target, vấn đề cần escalate, điều chỉnh nhỏ.\n**Monthly review** (xem Phase 4 — Check).',
        tool: 'Standup meetings · Visual board updates · A3 status tracking' },
      { num: '3.4', title: 'Standardize As You Go — Chuẩn hóa ngay khi thành công',
        body: 'Một nguyên tắc quan trọng Fukuda nhấn mạnh: khi một thử nghiệm cải tiến cho kết quả tốt, phải **chuẩn hóa ngay** — không để "best practice" tồn tại dưới dạng kiến thức cá nhân. Jackson gọi đây là "Standardized Work."\n\nNếu chỉ cải thiện mà không chuẩn hóa, khi người giỏi nghỉ việc, cải tiến biến mất theo.',
        tool: 'SOP updates · Standard Work sheets · Training materials' },
    ],
    ladysfit: '**Visual board thực tế:** Mỗi franchise có 1 bảng A1 hiển thị: (1) Retention rate tháng này vs target, (2) New member vs target, (3) Top 3 complaint tháng này đang xử lý. CEO kiểm tra board này khi ghé thăm — không cần báo cáo dài.\n\n**Standardize ngay:** Khi 1 franchise tìm được cách reduce dropout rate — viết thành SOP → train toàn hệ thống trong tháng đó.',
  },
  {
    num: '04', jp: 'チェック · CHECK', title: 'CHECK — KIỂM TRA & PHÁT HIỆN SAI LỆCH SỚM',
    desc: 'Check trong HK không phải kiểm soát — là học tập có hệ thống. Mục tiêu là phát hiện deviation sớm để điều chỉnh, không phải trừng phạt sau khi sai.',
    timing: '⏱ Monthly + Quarterly + Annual', who: '👥 All levels + CEO', badge: 'KHOA HỌC', color: '#E63946',
    steps: [
      { num: '4.1', title: 'Monthly Review — Kiểm tra tiến độ hàng tháng',
        body: 'Mỗi tháng, từng team review Bowling Chart: actual vs target. Không chỉ hỏi "đạt không?" mà hỏi **"tại sao chênh lệch?"** và **"cần điều chỉnh gì?"**\n\nJackson dùng A3-R (A3 Review) để document: (1) Current status, (2) Root cause của gaps, (3) Counter-measures đề xuất. Không phải báo cáo — là tài liệu tư duy.',
        tool: 'Bowling Chart · A3-R · Management Board review' },
      { num: '4.2', title: 'No-Blame Environment — Môi trường không đổ lỗi',
        body: 'Jackson dành hẳn một chương về "Create a No-Blame Environment." Lý do: nếu người dưới sợ bị phạt khi báo cáo vấn đề, họ sẽ che giấu vấn đề — và bạn chỉ phát hiện khi quá muộn.\n\n**Quy tắc:** người phát hiện vấn đề và báo cáo sớm = được khen, không bị phạt. Người che giấu vấn đề = vi phạm văn hóa tổ chức.',
        tool: 'Lãnh đạo làm gương · Reward early problem reporting' },
      { num: '4.3', title: "President's Diagnosis — Lãnh đạo tự kiểm tra quá trình",
        body: 'Jackson mô tả "President\'s Diagnosis" là một trong những công cụ mạnh nhất: CEO/lãnh đạo cao nhất **tự đi xuống** kiểm tra — không phải kết quả, mà **kiểm tra xem quy trình có đang được thực hiện đúng không.**\n\nFukuda gọi đây là "Condition 1: Top Management Commitment" — không phải commitment bằng lời, mà commitment bằng hành động có mặt trực tiếp tại nơi làm việc (Gemba).',
        tool: "Gemba walk · President's Diagnosis checklist · Transformation Ruler" },
      { num: '4.4', title: 'Annual Review — Kiểm tra toàn bộ chu kỳ năm',
        body: 'Vào cuối năm (hoặc tháng 10 để chuẩn bị cho năm tới), review toàn bộ: Objectives nào đạt? Nào chưa đạt? **Tại sao?** Bài học gì cho năm tới? **Hansei** — phản tư thành thật, không để bảo vệ kết quả.\n\nKết quả Annual Review là đầu vào trực tiếp cho Scan của năm tới — đây là cách HK trở thành **vòng lặp học tập, không phải quy trình tuyến tính.**',
        tool: 'Annual Review meeting · Hansei document · A3-SSR (Strategy Summary Review)' },
    ],
    warn: 'Hầu hết tổ chức kiểm tra **results** (kết quả cuối) mà bỏ qua kiểm tra **process** (quy trình). Jackson gọi đây là "management by results only" — nguy hiểm vì kết quả tốt đôi khi do may mắn, và kết quả xấu đôi khi do quy trình tốt nhưng gặp biến số ngoài tầm kiểm soát. Chỉ kiểm tra process mới học được bài học thực sự.',
    ladysfit: '**Monthly review format:** Họp 60 phút/tháng với franchise owners: 20 phút review Bowling Chart — đâu đạt/không đạt, 20 phút root cause analysis cho top 2 gaps, 20 phút đề xuất counter-measures.\n\n**President\'s Diagnosis:** CEO ghé thăm ngẫu nhiên 2–3 franchise/tháng — không báo trước. Không xem doanh thu (đã có báo cáo). Xem: visual board có cập nhật không? Trainer có follow SOP không? Member được chăm sóc đúng quy trình không?',
  },
  {
    num: '05', jp: 'アクト · ACT', title: 'ACT — ĐIỀU CHỈNH & THỂ CHẾ HÓA',
    desc: 'Giai đoạn cuối của vòng PDCA — không phải kết thúc mà là nơi kiến thức được thể chế hóa. Bài học năm này trở thành nền tảng cứng hơn cho năm tới.',
    timing: '⏱ Tháng 10–12 + Rolling', who: '👥 Lãnh đạo + HR + L&D', badge: 'THỂ CHẾ HÓA', color: '#7b2d8b',
    steps: [
      { num: '5.1', title: 'Kaizen — Điều chỉnh liên tục trong năm',
        body: 'ACT không phải chỉ xảy ra cuối năm. Trong suốt quá trình DO và CHECK, khi phát hiện deviation, cần **điều chỉnh ngay (Kaizen)** — không chờ đến Annual Review.\n\nJackson: "Experiment 7 of Hoshin Kanri là Kaizen." Tức là mỗi vòng PDCA nhỏ trong năm là một experiment — phát hiện sai → điều chỉnh → chuẩn hóa mới → thử lại.',
        tool: 'A3-P (Problem solving A3) · Kaizen events · PDCA mini-cycles' },
      { num: '5.2', title: 'Hansei — Phản tư thành thật',
        body: 'Hansei (反省) là thực hành tự phản tư thành thật — đánh giá không che đậy về những gì đã xảy ra. Khác với "lessons learned" thông thường (thường là danh sách đẹp để bảo vệ kết quả).\n\nCâu hỏi Hansei thực sự: **Chúng ta đã làm sai gì? Tại sao? Nếu làm lại, sẽ làm khác thế nào?** — Không phải "chúng ta đã đạt được gì" trước.',
        tool: 'Hansei document · Retrospective meeting · Hoshin Reflection Tool' },
      { num: '5.3', title: 'Institutionalize — Thể chế hóa thành Standard Work',
        body: 'Những cải tiến thành công trong năm phải được **chính thức hóa vào quy trình chuẩn**: cập nhật SOP, training materials, onboarding. Nếu bỏ qua bước này, tổ chức phải học lại bài học cũ mỗi năm.\n\nFukuda: "Good maintenance amplifies improvement results." Chuẩn hóa là cách duy trì gains — không phải optional.',
        tool: 'Standard Work documentation · SOP updates · Training module updates' },
      { num: '5.4', title: 'Leadership Development — Phát triển năng lực lãnh đạo kế tiếp',
        body: 'Jackson dành hẳn một phần về "Leadership Development and Succession Planning" trong giai đoạn ACT. Lý do: HK chỉ bền vững khi **nhiều người biết cách vận hành nó**, không chỉ 1–2 người.\n\nMỗi năm, xác định: leader nào đang sẵn sàng đảm nhận thêm trách nhiệm? Cần develop năng lực gì cho năm tới?',
        tool: 'Coaching sessions · Leadership pipeline review · Succession plan update' },
      { num: '5.5', title: 'Vòng lặp mới — Kết quả Annual Review → Input cho Scan năm tới',
        body: 'Đây là bước quan trọng nhất của ACT: **chuyển tất cả bài học và outputs của năm này thành inputs cho Scan năm tới.** Đây là điểm HK trở thành hệ thống học tập tích lũy — không phải quy trình năm nào cũng bắt đầu từ zero.\n\nSau 3–5 năm thực hành HK nghiêm túc, tổ chức không còn phải "áp dụng" HK nữa — HK trở thành cách tổ chức vận hành tự nhiên.',
        tool: 'Annual Review outputs → Scan inputs · Updated X-Matrix · Revised Target Condition', full: true },
    ],
    ladysfit: '**Hansei cuối năm với franchise owners:** Thay vì chỉ celebrate franchise tốt, tổ chức phiên Hansei chung: franchise nào khó khăn nhất năm qua? Bài học gì cho toàn hệ thống? Chia sẻ thành thật này có giá trị hơn mọi training session.\n\n**ACT → SCAN tiếp theo:** Retention data năm này, franchise performance ranking, trainer quality scores — tất cả trở thành Current State cho Scan năm tới. Không bao giờ bắt đầu lại từ đầu.',
  },
]

export const ANNUAL_CYCLE = [
  { num: 'OCT', label: 'THÁNG 10', act: 'Annual Review · Hansei · Bắt đầu Scan', color: '#7b2d8b' },
  { num: 'NOV', label: 'THÁNG 11', act: 'Scan hoàn tất · Xác định Breakthroughs · Bắt đầu Catchball', color: '#1a5fa8' },
  { num: 'DEC', label: 'THÁNG 12', act: 'Catchball hoàn tất · X-Matrix · Action Plans · Finalize', color: '#1e7a3c' },
  { num: 'JAN', label: 'THÁNG 1', act: 'Kick-off · Setup Visual Boards · Bắt đầu thực thi', color: '#1e7a3c' },
  { num: 'FEB–SEP', label: 'T.2 – T.9', act: 'DO: thực thi · Monthly Reviews · Kaizen liên tục', color: '#E07825' },
  { num: 'APR / JUL', label: 'Q2 / Q3', act: 'Quarterly Review · Mid-year course correction nếu cần', color: '#E63946' },
  { num: 'SEP', label: 'THÁNG 9', act: 'Pre-Annual Review · Chuẩn bị dữ liệu cho Annual Review', color: '#7b2d8b' },
  { num: 'OCT +1', label: 'NĂM SAU', act: 'Vòng lặp mới bắt đầu — với nền tảng cao hơn năm trước', color: '#1a5fa8' },
]
