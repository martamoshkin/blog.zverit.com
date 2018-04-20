---
layout: post
title:  "JSON конфигурация списка задач Hangfire и их runtime обновление"
date:   2016-06-17 23:30:29 +0300
image: "/assets/hangfire-logo.png"
image_alt: "Hangfire scheduler"
redirect_from: 
    - backend/2016/06/17/hangfire-config-joblist/backend/
category: Backend
author: "Artamoshkin Maxim"
tags: [Hangfire, Scheduler, C#]
description: "Явное описание задач в коде делает их достаточно неповоротливыми и неудобными в поддержке. Также было бы явным излишеством описывать однотипные задачи."
---

Явное описание задач в коде делает их достаточно неповоротливыми и неудобными в поддержке. 
Также было бы явным излишеством описывать однотипные задачи.

Было бы удобнее хранить их минимальное описание с параметрами в отдельном файле с JSON или XML разметкой, 
который бы автоматически подгружался при старте планировщика и далее уже обновлял список при условии, если он был изменен. 
У известного планировщика Quartz, такая фича идет уже из коробки, но к сожалению, в Hangfire ее нет. 
<!-- more -->


Опишем общий интерфейс задачи.

```cs
public interface IJob
{
	void Execute(Dictionary<string, string> parameters);
}
```

Для начала зарегистрируем имеющиеся джобы, удобным нам DI-контейнером. Для примера используем Castle Windsor. 

Регистрируем все джобы на базе интерфейса `IJob`.

```cs
container.Register(Classes.FromThisAssembly().BasedOn<IJob>());
```


Устанавливаем из NuGet дополнительный пакет:

```
Install-Package HangFire.Windsor
```

И подключаем `JobActivator`

```cs
GlobalConfiguration.Configuration.UseActivator(new WindsorJobActivator(container.Kernel));
```


После того как наши джобы зарегистрированы, приступим непосредственно к механизму конфигурации шедулера. 
Создаем файл конфигурации `config.json`. И определим формат записи задач. 

```json
[
  {
    "Id": "1",
    "Name": "ExampleJob",
    "CronExpression": "0 0 * * *",
    "Parameters": {
      "Parameter1": "Text",
      "Parameter2": "123"
    }
  },…
]
```

`Name` будет выступать как в роли названия джобы, так и названия ее класса. 
`CronExpression` - `Cron` выражения. `Parameters` - неограниченный список параметров, которые можно передать в тело джобы.

Создадим метод который будет загружать и сериализовать эти задачи:

```cs
private IList<JobItem> GetJobsList()
{
    using (var sr = new StreamReader(this.configPath))
    {
        return JsonConvert.DeserializeObject<IList<JobItem>>(sr.ReadToEnd());
    }
}
```

После того как наш шедулер может получать конфигурацию джоб извне создадим метод который будет добавлять в расписание и обновлять их конфигурацию. 		

```cs
private void UpdateConfiguration()
{
    var jobs = this.GetJobsList();
    
    foreach (var item in jobs)
    {
        var jobType = this.container.Kernel.GetAssignableHandlers(typeof(IJob))
			.Single(
				h => h.ComponentModel.Implementation.Name
						.Equals(item.Name, StringComparison.InvariantCultureIgnoreCase))
							.ComponentModel.Implementation;
		var job = (IJob) this.container.Resolve(jobType);

        RecurringJob.AddOrUpdate(item.Id, () => job.Execute(item.Parameters), item.CronExpression);
    }
}
```

Напишем функцию которая будет наблюдать за файлом конфигурации и обновлять задачи, в случае его изменения.

```cs
[PermissionSet(SecurityAction.Demand, Name = "FullTrust")]
private FileSystemWatcher CreateWatcher()
{
    var path = Path.IsPathRooted(this.configPath)
        ? this.configPath
        : Path.Combine(Directory.GetCurrentDirectory(), this.configPath);
    var configDir = Path.GetDirectoryName(path) ?? string.Empty;
    var extension = Path.GetExtension(path);

    var watcher = new FileSystemWatcher
    {
        Path = configDir,
        NotifyFilter = NotifyFilters.LastWrite,
        Filter = "*" + extension
    };

    watcher.Changed += this.OnConfigChanged;
    watcher.EnableRaisingEvents = true;

    return watcher;
}

private void OnConfigChanged(object sender, FileSystemEventArgs e)
{
    if (DateTime.UtcNow < this.lastConfigChange.AddMilliseconds(200))
    {
        return;
    }

    this.lastConfigChange = DateTime.UtcNow;
    this.UpdateConfiguration();
}
```

Если происходит изменение файла конфигурации, выполняется событие `OnConfigChanged`. И так как оно срабатывает несколько раз, то пропишем условие `if (DateTime.UtcNow < this.lastConfigChange.AddMilliseconds(200))`. Этого достаточно, чтобы оно сработало ровно один раз.
