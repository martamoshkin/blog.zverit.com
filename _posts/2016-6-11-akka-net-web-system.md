---
layout: post
title:  "AKKA.NET для построения высоконадежных и слабосвязанных Web-систем"
date:   2016-06-11 15:15:29 +0300
categories: akka sharp
---
Для 99% сложных технических проблем, с которыми разработчики сталкиваются сегодня, было найдено решение в начале 1970 году: модель акторов.
Предпосылка актор-модели заключается в том, что каждый компонент в этой системе есть «актор», и между акторами происходит общение, путем передачи сообщений между собой. Акторы имеют уникальные адреса внутри актор-системы, даже находясь на нескольких физических компьютерах, можно направить конкретное сообщение конкретному актору. У акторов также есть иерархия, родительские акторы контролируют дочерних, которые находятся на уровень ниже. Если дочерний актор внезапно выходит из строя, то родительский актор может принять решение о том, как поступить дальше.
```csharp
using (var actorSystem = ActorSystem.Create("DeliverySystem"))
{
var recipientActor = actorSystem.ActorOf(Props.Create(() => new RecipientActor()), "receiver");
var deliveryActor = actorSystem.ActorOf(Props.Create(() => new DeliveryActor(recipientActor)), "delivery");
actorSystem.WhenTerminated.Wait();
}
Опишем типы сообщений.
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
Далее опишем принимающий актор. 
public RecipientActor()
        {
            Receive<DeliveryEnvelope<Write>>(write =>
            {
                Console.WriteLine("Получено сообщение {0} [id: {1}] от {2} - подтвердить?", write.Message.Content, write.MessageId, Sender);
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

Затем опишем актор доставки сообщений. 
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
                DeleteSnapshots(new SnapshotSelectionCriteria(seqNo, saved.Metadata.Timestamp.AddMilliseconds(-1))); //удалить все, кроме текущего состояния            
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
    } [3]
```
