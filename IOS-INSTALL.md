# IPA для личного iPhone

Сборка запускается вручную в GitHub: Actions → iOS IPA for AltStore → Run workflow → main.
После успешного запуска скачать архив CATEC-SuperApp-unsigned в разделе Artifacts и распаковать IPA.

Workflow генерирует нативный проект из app.json, собирает Release для физического iPhone и включает JavaScript в приложение. Expo Go и запущенный ПК для работы приложения не нужны. Для облачных функций нужен интернет.

IPA неподписанный: он предназначен для подписи через AltStore Classic, а не для прямой установки из Safari. Установить AltServer на Windows по официальной инструкции https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows, затем AltStore на телефон. В AltStore открыть My Apps → + и выбрать IPA.

Бесплатная подпись Apple ID действует 7 дней. Обновление подписи требует AltServer; онлайн-обновления кода не заменяют подпись. EAS Update сейчас не настроен.

Стандартные GitHub-hosted runners бесплатны для публичных репозиториев. Для приватного репозитория действуют лимиты аккаунта; не включать платные runners и оплату сверх лимита.

Сборка считается подтверждённой только после успешного выполнения workflow и установки на телефон. Windows-проверки и expo export не создают установочный IPA и не подтверждают запись камеры, микрофон и клавиатуру iOS. Apple ID вводится только в AltServer/AltStore на устройстве пользователя, не в репозиторий или GitHub Actions.
