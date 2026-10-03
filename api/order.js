export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      customer,
      phone,
      address,
      comment,
      items,
      subtotal,
      delivery,
      total
    } = req.body || {};

    if (!customer || !phone || !address || !Array.isArray(items) || !items.length) {
      return res.status(400).json({
        ok: false,
        error: "Заполните имя, телефон, адрес и добавьте товар."
      });
    }

    const token = process.env.VK_TOKEN;
    const groupId = process.env.VK_GROUP_ID;

    if (!token || !groupId) {
      return res.status(500).json({
        ok: false,
        error: "VK пока не настроен."
      });
    }

    const itemsText = items.map((item) => {
      const quantity = Number(item.quantity || 1);
      const price = Number(item.price || 0);
      const size = item.size ? `, ${item.size}` : "";

      return `• ${item.name}${size} × ${quantity} — ${price * quantity} ₽`;
    }).join("\n");

    const message = [
      "🦓 НОВЫЙ ЗАКАЗ — ЗЕБРА ПИЦЦА",
      "",
      itemsText,
      "",
      `Товары: ${Number(subtotal || 0)} ₽`,
      `Доставка: ${Number(delivery || 0)} ₽`,
      `ИТОГО: ${Number(total || 0)} ₽`,
      "",
      `👤 ${customer}`,
      `📞 ${phone}`,
      `📍 ${address}`,
      comment ? `💬 ${comment}` : ""
    ].filter(Boolean).join("\n");

    const params = new URLSearchParams({
      access_token: token,
      v: "5.199",
      random_id: String(Date.now()),
      peer_id: String(groupId),
      message
    });

    const response = await fetch(
      `https://api.vk.com/method/messages.send?${params.toString()}`
    );

    const data = await response.json();

    if (data.error) {
      console.error("VK API error:", data.error);

      return res.status(502).json({
        ok: false,
        error: "VK не принял заказ."
      });
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      ok: false,
      error: "Не удалось отправить заказ."
    });
  }
}
