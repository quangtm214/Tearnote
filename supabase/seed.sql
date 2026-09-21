-- Comfort mồi. docs/overview.md §6: pool rỗng thì người đầu tiên mở app không nhận được gì.
-- Do chính tác giả dự án viết, không phải của người dùng thật. Chạy lại được nhiều lần.
--
-- Chạy bằng service role (MCP execute_sql hoặc SQL editor), không qua app:
-- RLS chặn insert từ client, và tài khoản mồi không đăng nhập bao giờ.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
values (
  '00000000-0000-0000-0000-0000000000aa',
  '00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','seed@tearnote.invalid','',
  now(), now(), now(), '{}', '{"seed": true}')
on conflict (id) do nothing;

insert into comforts (id, author_id, body, source_lang, tags, status) values
 ('5eed0001-0000-4000-8000-000000000001','00000000-0000-0000-0000-0000000000aa',
  'Người đó đi rồi, nhưng phần con người bạn đã yêu bằng cả lòng thì vẫn còn đó. Nó không mất đi cùng họ đâu.','vi','{heartbreak}','approved'),
 ('5eed0001-0000-4000-8000-000000000002','00000000-0000-0000-0000-0000000000aa',
  'Không có mốc thời gian nào cho chuyện này cả. Ai bảo bạn lẽ ra phải ổn rồi thì người đó đang đoán mò thôi.','vi','{grief}','approved'),
 ('5eed0001-0000-4000-8000-000000000003','00000000-0000-0000-0000-0000000000aa',
  'Bạn đang gánh một thứ nặng hơn những gì người khác nhìn thấy. Mệt là chuyện đương nhiên, không phải bạn yếu.','vi','{pressure}','approved'),
 ('5eed0001-0000-4000-8000-000000000004','00000000-0000-0000-0000-0000000000aa',
  'Cái giọng nói trong đầu đang chê bạn lúc này không công bằng, và nó cũng không phải là sự thật.','vi','{self_worth}','approved'),
 ('5eed0001-0000-4000-8000-000000000005','00000000-0000-0000-0000-0000000000aa',
  'Giờ này có một người lạ đọc được dòng bạn vừa ghi và hiểu chính xác cảm giác đó. Không đông đúc gì, nhưng không phải một mình.','vi','{loneliness}','approved'),
 ('5eed0001-0000-4000-8000-000000000006','00000000-0000-0000-0000-0000000000aa',
  'Thương một người mà vẫn thấy đau vì họ là chuyện bình thường. Hai điều đó ở cùng nhau được.','vi','{family}','approved'),
 ('5eed0001-0000-4000-8000-000000000007','00000000-0000-0000-0000-0000000000aa',
  'Không cần giải quyết gì đêm nay cả. Ngủ được thì ngủ, mai tính tiếp cũng không muộn.','vi','{overwhelm}','approved'),
 ('5eed0001-0000-4000-8000-000000000008','00000000-0000-0000-0000-0000000000aa',
  'Cái bạn đang sợ vẫn chưa xảy ra. Nó có thể xảy ra, nhưng ngay lúc này nó chưa.','vi','{anxiety}','approved'),
 ('5eed0001-0000-4000-8000-000000000009','00000000-0000-0000-0000-0000000000aa',
  'Khóc vì một thứ đẹp là dấu hiệu bạn vẫn còn nguyên vẹn bên trong. Giữ lấy cảm giác đó.','vi','{moved}','approved'),
 ('5eed0001-0000-4000-8000-00000000000a','00000000-0000-0000-0000-0000000000aa',
  'Không gọi tên được lý do cũng không sao. Cơ thể biết trước cái đầu, và nó đang nói với bạn điều gì đó.','vi','{unknown}','approved'),
 ('5eed0001-0000-4000-8000-00000000000b','00000000-0000-0000-0000-0000000000aa',
  'Bạn không cần phải hiểu chuyện gì đang xảy ra thì mới được phép buồn về nó.','vi','{unknown}','approved'),
 ('5eed0001-0000-4000-8000-00000000000c','00000000-0000-0000-0000-0000000000aa',
  'Hôm nay bạn đã làm một việc: bạn ghi nó lại thay vì nuốt vào trong. Chừng đó là đủ cho hôm nay.','vi','{unknown}','approved')
on conflict (id) do nothing;

insert into comfort_translations (comfort_id, lang, body) values
 ('5eed0001-0000-4000-8000-000000000001','en','They are gone, but the part of you that loved that hard is still here. It did not leave with them.'),
 ('5eed0001-0000-4000-8000-000000000001','ja','あの人はいなくなっても、あれほど深く愛せたあなたの部分は残っています。一緒に消えたりしません。'),
 ('5eed0001-0000-4000-8000-000000000002','en','There is no schedule for this. Anyone telling you that you should be over it by now is guessing.'),
 ('5eed0001-0000-4000-8000-000000000002','ja','これに期限はありません。もう立ち直っているはずだと言う人は、ただ当て推量しているだけです。'),
 ('5eed0001-0000-4000-8000-000000000003','en','You are carrying more than anyone can see. Being tired is the expected outcome, not a personal failure.'),
 ('5eed0001-0000-4000-8000-000000000003','ja','人から見える以上の重さを背負っています。疲れるのは当然の結果で、弱さではありません。'),
 ('5eed0001-0000-4000-8000-000000000004','en','The voice criticising you right now is not being fair, and it is not telling the truth either.'),
 ('5eed0001-0000-4000-8000-000000000004','ja','今あなたを責めている声は公平ではないし、本当のことを言ってもいません。'),
 ('5eed0001-0000-4000-8000-000000000005','en','Somewhere right now a stranger read what you wrote and knew the feeling exactly. Not crowded, but not alone.'),
 ('5eed0001-0000-4000-8000-000000000005','ja','今この瞬間、見知らぬ誰かがあなたの言葉を読んで、その気持ちをそのまま理解しました。にぎやかではないけれど、ひとりではありません。'),
 ('5eed0001-0000-4000-8000-000000000006','en','You can love someone and still be hurt by them. Both things fit in the same place.'),
 ('5eed0001-0000-4000-8000-000000000006','ja','誰かを大切に思いながら、その人に傷つけられることもあります。その二つは同時に存在できます。'),
 ('5eed0001-0000-4000-8000-000000000007','en','Nothing has to be solved tonight. Sleep if sleep comes; tomorrow is soon enough.'),
 ('5eed0001-0000-4000-8000-000000000007','ja','今夜のうちに解決しなければならないことは何もありません。眠れるなら眠って、続きは明日で十分です。'),
 ('5eed0001-0000-4000-8000-000000000008','en','The thing you are afraid of has not happened. It may. Right now it has not.'),
 ('5eed0001-0000-4000-8000-000000000008','ja','あなたが恐れていることは、まだ起きていません。起きるかもしれません。でも今はまだです。'),
 ('5eed0001-0000-4000-8000-000000000009','en','Crying at something beautiful means you are still intact in there. Hold on to that.'),
 ('5eed0001-0000-4000-8000-000000000009','ja','美しいものに涙が出るのは、あなたの中がまだ無事だという証拠です。それを手放さないで。'),
 ('5eed0001-0000-4000-8000-00000000000a','en','Not being able to name the reason is fine. The body knows before the head does, and it is telling you something.'),
 ('5eed0001-0000-4000-8000-00000000000a','ja','理由に名前をつけられなくても大丈夫。体は頭より先に気づいていて、何かを伝えようとしています。'),
 ('5eed0001-0000-4000-8000-00000000000b','en','You do not have to understand what is happening in order to be allowed to feel bad about it.'),
 ('5eed0001-0000-4000-8000-00000000000b','ja','何が起きているのか理解できていなくても、つらいと感じていいのです。'),
 ('5eed0001-0000-4000-8000-00000000000c','en','You did one thing today: you wrote it down instead of swallowing it. That is enough for today.'),
 ('5eed0001-0000-4000-8000-00000000000c','ja','今日ひとつだけできたことがあります。飲み込まずに書き留めたこと。今日はそれで十分です。')
on conflict (comfort_id, lang) do nothing;

-- Hotline. App vẫn đóng gói bản dự phòng trong máy — ADR 0005.
insert into hotlines (country, name, phone, url, hours, sort) values
 ('VN','Đường dây nóng Ngày Mai (sức khoẻ tâm thần)','096 306 1414',null,'13:00–20:30, thứ 4 đến CN',1),
 ('VN','Tổng đài Quốc gia Bảo vệ Trẻ em','111',null,'24/7',2),
 ('JP','こころの健康相談統一ダイヤル','0570-064-556',null,'都道府県により異なる',1),
 ('JP','TELL Lifeline (tiếng Anh)','03-5774-0992','https://telljp.com','9:00–23:00',2),
 ('US','988 Suicide & Crisis Lifeline','988','https://988lifeline.org','24/7',1),
 ('GB','Samaritans','116 123','https://samaritans.org','24/7',1)
on conflict do nothing;
