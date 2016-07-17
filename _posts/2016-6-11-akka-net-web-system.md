---
layout: post
title:  "AKKA.NET для построения высоконадежных и слабосвязанных Web-систем"
date:   2016-06-11 15:15:29 +0300
category: Development
tags: [akka.net, aktor, C#]
---
<img class="post-logo" src="https://blog.zverit.com/assets/akkalogo.png" />

Для 99% сложных технических проблем, с которыми разработчики сталкиваются сегодня, было найдено решение в начале 1970 году: модель 
акторов.<!-- more --> 

Предпосылка актор-модели заключается в том, что каждый компонент в этой системе есть «актор», и между акторами происходит общение,
путем передачи сообщений между собой. Акторы имеют уникальные адреса внутри актор-системы, даже находясь на нескольких физических компьютерах, можно направить конкретное сообщение конкретному актору.<!-- more -->  У акторов также есть иерархия, родительские акторы контролируют дочерних, которые находятся на уровень ниже. Если дочерний актор внезапно выходит из строя, то родительский актор может принять решение о том, как поступить дальше.

Так чем же привлекательна модель актора? Основные преимущества:

1.	Акторы очень «дешевые» — вы можете создать 10 миллионов с минимальными системными затратами.
2.	Иерархия актора и наблюдение за дочерними, делает нашу систему самовосстанавливающейся и стабильной. 
3.	Актор-модель предоставляет простое API для параллельных вычислений.
4.	Удаленное взаимодействие между актор-системами упрощает маршрутизацию данных для каждого пользователя в определенном месте.
5.	Актор обрабатывает только одно сообщение из очереди.

Akka.NET предоставляет все эти возможности на языках C# и F#.

Устройство актора в Akka.NET включает себя поведение, «почтовый ящик», состояние, его «детей» и стратегию руководителя.

{:.center}
![Устройство актора в Akka.NET](https://blog.zverit.com/assets/aktor-body.png)

Актор должен быть защищен от воздействия извне. Таким образом, акторы доступны извне по ссылке, которые представлены объектом. Деление на внутренний и внешний объект обеспечивает прозрачность для всех операций. Но более важным аспектом является то, что нет возможности заглянуть во внутрь актора и получить его состояние снаружи.

**Состояние**. Объекты актора, как правило, содержат переменные, которые отражают его состояния. Это могут быть самые разные данные, которые делают актора полезным.

**Поведение**. Каждое сообщение переданное на обработку, будет сравниваться с поведением актора. Поведение означает функцию, с определенными действиями, которые будут предприняты в ответ на сообщения, например, записать данные пользователя и отправить уведомление об успешной операции записи. Поведение может изменяться с течением времени. Однако, первоначальное поведение определяются во время строительства его объекта, после перезапуска его поведение вернется в первоначальное состояние.

**«Почтовый ящик»**. Целью актора является обработка сообщений, и эти сообщения принимаются из других акторов (или из пределов актор-системы). Место, куда приходят сообщения от других акторов называется «почтовый ящик». Актор имеет только один «почтовый ящик», где сообщения ставятся в очередь точно в том же порядке в каком они были получены. Примером сообщения служит обычный класс C#. 

**«Дети»**. Каждый актор может стать руководителем. Если он создает детей, то он автоматически становится руководителем. Список «детей» хранится в контексте. 

**Стратегия руководителя**. В последней части актора находится стратегия для обработки ошибок его «детей». Устранение неисправностей в Akka становится довольно прозрачным, применяя стратегию отписки наблюдения и мониторинга, для всех кто вышел из строя.

{:.center}
![Стратегия наблюдателя «один для одного»](https://blog.zverit.com/assets/error-kernel-akka.png)

Акторы в C# реализуются путем расширения класса `ReceiveActor` и настройки, что получает сообщения используя `Receive<TMessage>` метод.

`Props` это объект который используется для создания актора в главной `ActorSystem` или в рамках другого актора.

```cs
Props sampleActorProps = Props.Create<SampleActor>();
```

При помощи Akka.NET построим систему явного подтверждения обработки сообщений. В точке входа в приложение создадим актор-систему, принимающий актор и актор доставки.

```cs
using (var actorSystem = ActorSystem.Create("DeliverySystem"))
{
  var recipientActor = actorSystem.ActorOf(Props.Create(() => new RecipientActor()), "receiver");
  var deliveryActor = actorSystem.ActorOf(Props.Create(() => new DeliveryActor(recipientActor)), "delivery");
  actorSystem.WhenTerminated.Wait();
}
```

Опишем типы сообщений.

```cs
public class DeliveryEnvelope<TMessage>
  {
      public DeliveryEnvelope(TMessage message, long messageId)
      {
          Message = message;
          MessageId = messageId;
      }
      public TMessage Message { get; private set; }
      public long MessageId { get; private set; }
  }
  public class DeliveryAck
  {
      public DeliveryAck(long messageId)
      {
          MessageId = messageId;
      }

      public long MessageId { get; private set; }
  }
  public class Write
  {
      public Write(string content)
      {
          Content = content;
      }
      public string Content { get; private set; }
  }
}
```

Далее опишем принимающий актор. 

```cs
public RecipientActor()
{
    Receive<DeliveryEnvelope<Write>>(write =>
    {
        Console.WriteLine("Получено сообщение {0} [id: {1}] от {2} - подтвердить?",
          write.Message.Content, write.MessageId, Sender);
        var response = Console.ReadLine()?.ToLowerInvariant();
        if (!string.IsNullOrEmpty(response) && (response.Equals("да") || response.Equals("д")))
        {
            // подтверждаем доставку
            Sender.Tell(new DeliveryAck(write.MessageId));
            Console.WriteLine($"Подтверждение сообщения {write.MessageId}",);
        }
        else
        {
            Console.WriteLine($"Сообщение {write.MessageId} не подтверждено");
        }
    });
}
```

Затем опишем актор доставки сообщений. 

```cs
public class DeliveryActor : AtLeastOnceDeliveryReceiveActor
{
    public override string PersistenceId => Context.Self.Path.Name;
    private int counter = 0;
    private class DoSend { }
    private class CleanSnapshots { }
    private ICancelable messageSend;
    private readonly IActorRef targetActor;
    private ICancelable snapshotCleanup;
    
    const string Characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    public DeliveryActor(IActorRef targetActor)
    {
        this.targetActor = targetActor;

        // восстановим последнее состояние доставки
        Recover<SnapshotOffer>(offer => offer.Snapshot is AtLeastOnceDeliverySnapshot, offer =>
        {
            var snapshot = offer.Snapshot as AtLeastOnceDeliverySnapshot;
            SetDeliverySnapshot(snapshot);
        });
        Command<DoSend>(send =>
        {
            Self.Tell(new Write("Сообщение " + Characters[this.counter++ % Characters.Length]));
        });

        Command<Write>(write =>
        {
            Deliver(this.targetActor.Path, messageId => new DeliveryEnvelope<Write>(write, messageId));

            // сохраняем полное состояние
            SaveSnapshot(GetDeliverySnapshot());
        });

        Command<DeliveryAck>(ack =>
        {
            ConfirmDelivery(ack.MessageId);
        });

        Command<CleanSnapshots>(clean =>
        {
            // сохранить текущее состояние подтверждений
            SaveSnapshot(GetDeliverySnapshot());
        });

        Command<SaveSnapshotSuccess>(saved =>
        {
            var seqNo = saved.Metadata.SequenceNr;
            DeleteSnapshots(new SnapshotSelectionCriteria(seqNo, saved.Metadata.Timestamp.AddMilliseconds(-1)));          
});
    }

    protected override void PreStart()
    {
        this.messageSend = Context.System.Scheduler.ScheduleTellRepeatedlyCancelable(TimeSpan.FromSeconds(1),
            TimeSpan.FromSeconds(10), Self, new DoSend(), Self);

        this.snapshotCleanup =
            Context.System.Scheduler.ScheduleTellRepeatedlyCancelable(TimeSpan.FromSeconds(10),
                TimeSpan.FromSeconds(10), Self, new CleanSnapshots(), ActorRefs.NoSender);

        base.PreStart();
    }
    protected override void PostStop()
    {
        this.snapshotCleanup?.Cancel();
        this.messageSend?.Cancel();

        base.PostStop();
    }
}
```

{:.center}
->![Результат выполнения программы](https://blog.zverit.com/assets/akka-sample-result.png)

Akka.NET — это благо для производительности, так как программирование ее моделей просты — вместо того, чтобы писать код, который, к примеру, пытается  присвоить права компании для 100 000 пользователей параллельно, вместо этого мы можем написать не большую часть кода, который делает это определение для одного пользователя и запускает 100 000 экземпляров с минимальными затратами. 

Благодаря идеологии Akka.NET легко построить сложные, но надежные системы с простой реализацией, что гораздо облегчает дальнейшее их сопровождение. 

