---
title: Простой Form Control с маской ввода
layout: post
image: "/assets/angular-mask.png"
image_alt: "Card mask Angular form control"
date: '2017-05-31 11:25:11 +0300'
category: Frontend
author: "Artamoshkin Maxim"
image_height: "auto"
redirect_from:
    - /frontend/2017/05/31/simple-mask-form-control/frontend
tags:
- Angular
- Form Control
- ControlValueAccessor
description: "В статье рассматривается разработка простого Mask Form Control для Angular, основные принципы использования ControlValueAccessor" 
---

В этой статье рассмотрим как создать простую маску ввода, которая будет задаваться массивом RegExp и знаков разделителей. Решение не универсально, но вполне применимо в большинстве случаев. И если вы не хотите включать в зависимость тяжеловесные библиотеки с множеством лишних функций и сложной логикой, то это решение для вас.
<!-- more -->

<br>

### ControlValueAccessor ###
Создание кастомного Form Control'а начинается с имплементации интерфейса `ControlValueAccessor`. 
`ControlValueAccessor` устанавливает связь между контролом и нативным элементом.

Который содержит в себе 4 описания функций: 
- `writeValue(obj: any): void;` – записывает новое значение в элемент
- `registerOnChange(fn: any): void;` – устанавливает функцию которая будет вызвана после того, как контрол получит change событие.
- `registerOnTouched(fn: any): void;` – устанавливает функцию которая вызывается после нажатия на контрол.
- `setDisabledState?(isDisabled: boolean): void;` – эта функция не обязательна к имплементации. Она вызывается когда контрол получает состояния **disabled**. В теле функции описывается поведение в зависимости от статуса.

После имплементации они выглядят примерно так:

```ts
private _onChange: Function = (_: any) => { }

private _onTouched: Function = (_: any) => { }

public writeValue(value: string): void {
	this.mdInput.setValue(value);
}

public registerOnChange(fn: any): void {
	this._onChange = fn;
}

public registerOnTouched(fn: any): void {
	this._onTouched = fn;
}
```


### Описание компонента ###

Для того, чтобы закрепить `ControlValueAccessor` за нашим котролом мы должны 'информировать' `NG_VALUE_ACCESSOR`, который отвечает за биндинг данных. 

```ts
@Component({
  selector: 'md-input',
  templateUrl: './md-input.component.html',
  styleUrls: ['./md-input.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MaskedInputComponent),
      multi: true,
    }
  ]
})
```

Далее начнем работать непосредственно над компонентом маски ввода.
Создадим его шаблон.

```html
<div class="group">
  <input #mdInputEl class="spacer"
         [formControl]="mdInput"/>
  <span class="highlight"></span>
  <span class="bar"></span>
  <label>{{title}}</label>
</div>
```

Получаем доступ к нативному элементу

```ts
@ViewChild('mdInputEl') public mdInputEl: ElementRef;
```

и создаем FormControl, который мы заранее доабвили в шаблоне, путем присвоения атрибута `[formControl]` у `<input>`.

```ts
public mdInput = new FormControl();
```


### Наблюдение и обработка новых значений ###

Для того, чтобы следить за изменениями значения в **FormControl** подпишемся на соответствующий **Observable** при инициализации компонента. 

```ts
  public ngOnInit(): void {
    this.mdInput.valueChanges
      .subscribe((value: string) => {
	//
        },
        (err) => console.warn(err)
      );
  }
```

И добавим туда следующую логику:

```ts
if (!value || value === this._previousValue) {
    return;
}

this._currentCursorPosition = this.mdInputEl.nativeElement.selectionEnd;

const placeholder = this._convertMaskToPlaceholder();

const values = this._conformValue(value, placeholder);

const adjustedCursorPosition = this._getCursorPosition(value, placeholder, values.conformed);

this.mdInputEl.nativeElement.value = values.conformed;
this.mdInputEl.nativeElement.setSelectionRange(
    adjustedCursorPosition,
    adjustedCursorPosition,
    'none');

this._onChange(values.cleaned);

this._previousValue = values.conformed;
this._previousPlaceholder = placeholder;

```

`this.mdInputEl.nativeElement.selectionEnd` предназначен для получения/задания конечной позиции выделения, но в нашем случае это неплохой способ получить текущую позицию курсора.

Затем получаем шаблон для поля ввода, и делается это в соответствии с заданой маской. 

Следующим шагом идет преобразование значения из поля по маске. Где на выходе два значения: преобразованое - шаблонизированное по маске, и чистое значение для отправки на сервер.

Далее получаем корректное положение курсора, в зависимости от произошедшего события (удаление, удаление из середины строки, добавление в начало строки и т.д.). И функцией `setSelectionRange()` присваиваем значение позиции курсора.

Вызываем коллбек `_onChange(value: any)` для обновления значения в модели. 

И в конце сохраняем значения, которые небоходимы для обработки последующих изменений.

Теперь каждую функцию рассмотрим подробнее.


### Шаблон ввода ###
Шаблон конвертируем из маски путем сопоставления ее элементов: если это RegExp то ставим спец.символ шаблона, в ином случае добавляем содержание этого элемента.

```ts
private _convertMaskToPlaceholder(): string {
    return this.mask.map((char) => {
        return (char instanceof RegExp) ? this._placeholderChar : char;
    }).join('');
}
```


### Трансформация значения ###

Следующим шагом идет трансформация значениия полученного из поля ввода в два значения: певрвое – преобразованное значение в паттерном ввода, второе – чистое значение.

```ts
private _conformValue(value: string, placeholder: string): { conformed: string, cleaned: string } {
    const editDistance = value.length - this._previousValue.length;
    const isAddition = editDistance > 0;
    const indexOfFirstChange = this._currentCursorPosition + (isAddition ? -editDistance : 0);
    const indexOfLastChange = indexOfFirstChange + Math.abs(editDistance);

    if (!isAddition) {
        let compensatingPlaceholderChars = '';

        for (let i = indexOfFirstChange; i < indexOfLastChange; i++) {
            if (placeholder[i] === this._placeholderChar) {
                compensatingPlaceholderChars += this._placeholderChar;
            }
        }

        value =
            (value.slice(0, indexOfFirstChange) +
            compensatingPlaceholderChars +
            value.slice(indexOfFirstChange, value.length)
        );
    }

    const valueArr = value.split('');

    for (let i = value.length - 1; i >= 0; i--) {
        let char = value[i];

        if (char !== this._placeholderChar) {
            const shouldOffset = i >= indexOfFirstChange &&
                this._previousValue.length === this._maxInputValue;

            if (char === placeholder[(shouldOffset) ? i - editDistance : i]) {
                valueArr.splice(i, 1);
            }
        }
    }

    let conformedValue = '';
    let cleanedValue = '';

    placeholderLoop: for (let i = 0; i < placeholder.length; i++) {
        const charInPlaceholder = placeholder[i];

        if (charInPlaceholder === this._placeholderChar) {
            if (valueArr.length > 0) {
                while (valueArr.length > 0) {
                    let valueChar = valueArr.shift();

                    if (valueChar === this._placeholderChar) {
                        conformedValue += this._placeholderChar;

                        continue placeholderLoop;
                    } else if (this.mask[i].test(valueChar)) {
                        conformedValue += valueChar;
                        cleanedValue += valueChar;

                        continue placeholderLoop;
                    }
                }
            }

            conformedValue += placeholder.substr(i, placeholder.length);
            break;
        } else {
            conformedValue += charInPlaceholder;
        }
    }

    return {conformed: conformedValue, cleaned: cleanedValue};
}
```


Этот блок выполнится в случае удаления.

```ts
if (!isAddition) {
    let compensatingPlaceholderChars = '';

    for (let i = indexOfFirstChange; i < indexOfLastChange; i++) {
        if (placeholder[i] === this._placeholderChar) {
            compensatingPlaceholderChars += this._placeholderChar;
        }
    }

    value =
        (value.slice(0, indexOfFirstChange) +
        compensatingPlaceholderChars +
        value.slice(indexOfFirstChange, value.length)
    );
}
```
На позиции удаленного символа подставляется знак маски.

Следующий цикл удаляет символы маски из ввода.

```ts
for (let i = value.length - 1; i >= 0; i--) {
    let char = value[i];

    if (char !== this._placeholderChar) {
        const shouldOffset = i >= indexOfFirstChange &&
            this._previousValue.length === this._maxInputValue;

        if (char === placeholder[(shouldOffset) ? i - editDistance : i]) {
            valueArr.splice(i, 1);
        }
    }
}

```

К примеру до ввода маска zip кода была `00000 ____` и пользователь ввел еще одну цифру, то цикл удалит знак "_" и на этом месте окажется введнная цифра: `00000 1___` .

И вот он, "главный" цикл, который составляет значения шаблона в соответствии с маской.

```ts
placeholderLoop: for (let i = 0; i < placeholder.length; i++) {
    const charInPlaceholder = placeholder[i];

    if (charInPlaceholder === this._placeholderChar) {
        if (valueArr.length > 0) {
            while (valueArr.length > 0) {
                let valueChar = valueArr.shift();

                if (valueChar === this._placeholderChar) {
                    conformedValue += this._placeholderChar;

                    continue placeholderLoop;
                } else if (this.mask[i].test(valueChar)) {
                    conformedValue += valueChar;
                    cleanedValue += valueChar;

                    continue placeholderLoop;
                }
            }
        }

        conformedValue += placeholder.substr(i, placeholder.length);
        break;
    } else {
        conformedValue += charInPlaceholder;
    }
}
```

Основной принцип которого: i-й символ это символ шаблона или же это регулярка по маске и значение подходит под ее условие - добавляем к значению, в ином случае игнор.


### Вычисление позиции курсора ###

После того когда получили преобразованные значения, нужно корректно установить курсор, с учетом различных действий пользователя.

```ts
private _getCursorPosition(value: string, placeholder: string, conformedValue: string): number {
    if (this._currentCursorPosition === 0) {
        return 0;
    }

    const editLength = value.length - this._previousValue.length;
    const isAddition = editLength > 0;
    const isFirstValue = this._previousValue.length === 0;
    const isPartialMultiCharEdit = editLength > 1 && !isAddition && !isFirstValue;

    if (isPartialMultiCharEdit) {
        return this._currentCursorPosition;
    }

    const possiblyHasRejectedChar = isAddition && (
        this._previousValue === conformedValue ||
        conformedValue === placeholder);

    let startingSearchIndex = 0;
    let trackRightCharacter;
    let targetChar;

    if (possiblyHasRejectedChar) {
        startingSearchIndex = this._currentCursorPosition - editLength;
    } else {
        const normalizedConformedValue = conformedValue.toLowerCase();
        const normalizedValue = value.toLowerCase();

        const leftHalfChars = normalizedValue.substr(0, this._currentCursorPosition).split('');

        const intersection = leftHalfChars.filter((char) => normalizedConformedValue.indexOf(char) !== -1);

        targetChar = intersection[intersection.length - 1];

        const previousLeftMaskChars = this._previousPlaceholder
            .substr(0, intersection.length)
            .split('')
            .filter((char) => char !== this._placeholderChar)
            .length;

        const leftMaskChars = placeholder
            .substr(0, intersection.length)
            .split('')
            .filter((char) => char !== this._placeholderChar)
            .length;

        const maskLengthChanged = leftMaskChars !== previousLeftMaskChars;

        const targetIsMaskMovingLeft = (
            this._previousPlaceholder[intersection.length - 1] !== undefined &&
            placeholder[intersection.length - 2] !== undefined &&
            this._previousPlaceholder[intersection.length - 1] !== this._placeholderChar &&
            this._previousPlaceholder[intersection.length - 1] !== placeholder[intersection.length - 1] &&
            this._previousPlaceholder[intersection.length - 1] === placeholder[intersection.length - 2]
        );

        if (!isAddition &&
            (maskLengthChanged || targetIsMaskMovingLeft) &&
            previousLeftMaskChars > 0 &&
            placeholder.indexOf(targetChar) > -1 &&
            value[this._currentCursorPosition] !== undefined) {
            trackRightCharacter = true;
            targetChar = value[this._currentCursorPosition];
        }

        const countTargetCharInIntersection = intersection.filter((char) => char === targetChar).length;

        const countTargetCharInPlaceholder = placeholder
            .substr(0, placeholder.indexOf(this._placeholderChar))
            .split('')
            .filter((char, index) => (
                char === targetChar &&
                value[index] !== char
            )).length;

        const requiredNumberOfMatches =
            (countTargetCharInPlaceholder + countTargetCharInIntersection + (trackRightCharacter ? 1 : 0));

        let numberOfEncounteredMatches = 0;
        for (let i = 0; i < conformedValue.length; i++) {
            const conformedValueChar = normalizedConformedValue[i];

            startingSearchIndex = i + 1;

            if (conformedValueChar === targetChar) {
                numberOfEncounteredMatches++;
            }

            if (numberOfEncounteredMatches >= requiredNumberOfMatches) {
                break;
            }
        }
    }

    if (isAddition) {
        let lastPlaceholderChar = startingSearchIndex;

        for (let i = startingSearchIndex; i <= placeholder.length; i++) {
            if (placeholder[i] === this._placeholderChar) {
                lastPlaceholderChar = i;
            }

            if (placeholder[i] === this._placeholderChar || i === placeholder.length) {
                return lastPlaceholderChar;
            }
        }
    } else {
        if (trackRightCharacter) {
            for (let i = startingSearchIndex - 1; i >= 0; i--) {
                if (
                    conformedValue[i] === targetChar ||
                    i === 0
                ) {
                    return i;
                }
            }
        } else {
            for (let i = startingSearchIndex; i >= 0; i--) {
                if (placeholder[i - 1] === this._placeholderChar || i === 0) {
                    return i;
                }
            }
        }
    }
}
```
В целом все проверки имеют соответствующие названия и ясно их предназначение. Но на всякий случай объясню некоторые.

```ts 
const possiblyHasRejectedChar = isAddition && (
    this._previousValue === conformedValue ||
    conformedValue === placeholder);
```

Эта проверка на случай если в шаблоне `111__ ____` с маской zip индекса (`\d\d\d\d\d \d\d\d\d`) был введен символ `111r_ ____`, то значение не должно измениться и курсор остаться на своем месте.


Проверяем, символ маски ли это и есть ли смещение влево:

```ts
const targetIsMaskMovingLeft = (
            this._previousPlaceholder[intersection.length - 1] !== undefined &&
            placeholder[intersection.length - 2] !== undefined &&
            this._previousPlaceholder[intersection.length - 1] !== this._placeholderChar &&
            this._previousPlaceholder[intersection.length - 1] !== placeholder[intersection.length - 1] &&
            this._previousPlaceholder[intersection.length - 1] === placeholder[intersection.length - 2]
        );
```

Если произошло удаление и `targetChar` это символ от шаблона, и также изменилась длина шаблона или маска сместилась влево, то отслеживаем на символ справа от курсора:

```ts
if (!isAddition &&
    (maskLengthChanged || targetIsMaskMovingLeft) &&
    previousLeftMaskChars > 0 &&
    placeholder.indexOf(targetChar) > -1 &&
    value[this._currentCursorPosition] !== undefined) {
    trackRightCharacter = true;
    targetChar = value[this._currentCursorPosition];
}
```

Далее подсчитываем сколько раз `targetChar` встречается в пересечениях и в шаблоне.

```ts
const countTargetCharInIntersection = intersection.filter((char) => char === targetChar).length;

const countTargetCharInPlaceholder = placeholder
    .substr(0, placeholder.indexOf(this._placeholderChar))
    .split('')
    .filter((char, index) => (
        char === targetChar &&
        value[index] !== char
    )).length;
```

Следущим циклом ищем расположение `targetChar`.

```ts
let numberOfEncounteredMatches = 0;
for (let i = 0; i < conformedValue.length; i++) {
    const conformedValueChar = normalizedConformedValue[i];

    startingSearchIndex = i + 1;

    if (conformedValueChar === targetChar) {
        numberOfEncounteredMatches++;
    }

    if (numberOfEncounteredMatches >= requiredNumberOfMatches) {
        break;
    }
}
```
После первого совпадения выходим из цикла. Если идет поиск второй единицы в `1234`, то `startingSearchIndex` после выполнения будет иметь значение `4`.

Следующая логика выполняется при добавлении символов.

```ts
if (isAddition) {
    let lastPlaceholderChar = startingSearchIndex;

    for (let i = startingSearchIndex; i <= placeholder.length; i++) {
        if (placeholder[i] === this._placeholderChar) {
            lastPlaceholderChar = i;
        }

        if (placeholder[i] === this._placeholderChar || i === placeholder.length) {
            return lastPlaceholderChar;
        }
    }
}
```
Запоминается последний символ шаблона, и если маска содержит после него еще символы, то курсор не в право уже не должен перемещаться, а остановиться у последнего символа шаблона.

Следующая логика выполняется если не `isAddition`, то есть в случае удаления.

```ts
if (trackRightCharacter) {
    for (let i = startingSearchIndex - 1; i >= 0; i--) {
        if (
            conformedValue[i] === targetChar ||
            i === 0
        ) {
            return i;
        }
    }
} else {
    for (let i = startingSearchIndex; i >= 0; i--) {
        if (placeholder[i - 1] === this._placeholderChar || i === 0) {
            return i;
        }
    }
}
```

Ищем символ который стоял справа от курсора. Поиск начинается с `startingSearchIndex - 1` потому, что в ином случае будет включен лишний символ справа. 
Поиск перемещается влево, пока не будет найдено то место и тот символ. Затем будет выставлен курсор справа от удаленного символа.

На этом работы с положением курсора достаточно, основные случаи описаны.


### Валидация ###
И создаем форму с валидатором.

```ts
this.cardForm = this._formBuilder.group({
      card: ['', Validators.pattern(/^[0-9]{16}$/)]
    });

this.cardForm.controls.card.setValue('1234567890123456');
```

### Результат ###


Теперь контрол маски ввода готов к использованию.

Задается маска следующим образом:

```ts
 public cardMask = [/\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/];
```


<img src="https://blog.zverit.com/assets/card-mask-component.png" alt="Card mask Angular form control" /> 



<iframe style="width: 100%; height: 600px" src="https://embed.plnkr.co/UViP4NEUY4Lh7o4z13Z0" frameborder="0" allowfullscren="allowfullscren"></iframe>
