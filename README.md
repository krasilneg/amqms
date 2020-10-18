### Реализация тестового задания

#### Настройка

Код микросервисов расположен в директориях **ms1** и **ms2** проекта
В каждой из директорий необходимо выполнить

```sh
npm install
```

создать файл **.env** со следующими настройками

```
PORT=[порт на котором будет запущен микросервис]
DB_URI=[URI подключения к базе MongoDB]
AMQP_URI=[URI AMQP сервера]
DOC_QUEUE=[название очереди обрабатываемых документов]
STATUS_QUEUE=[название очереди оповещений о статусе обработки документа]
```

### Запуск

В каждой из директорий микросервисов выполнить

```sh
npm start
```
