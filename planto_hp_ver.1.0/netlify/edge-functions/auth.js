export default async (request, context) => {
  // ユーザー名: planto 、 パスワード: planto0321
  // この2つを暗号化した文字列が "cGxhbnRvOnBsYW50bzAzMjE=" になります
  const expected = "Basic cGxhbnRvOnBsYW50bzAzMjE=";
  const auth = request.headers.get("authorization");

  if (auth === expected) {
    return context.next(); // パスワードが合っていればサイトを表示
  }

  // 合っていない、または未入力の場合は入力画面を出す
  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Team Only"',
    },
  });
};
