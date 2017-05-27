---
title: Простой Form Control с маской ввода
layout: post
date: '2017-05-27 11:25:11 +0300'
category: Backend
tags:
- Angular
- Form Control
- ControlValueAccessor
---

<img class="post-logo" src="https://blog.zverit.com/assets/angular-mask.png" alt="Card mask Angular form control" />

В этой статье рассмотрим как создать простую маску ввода, которая будет задаваться массивом RegExp и знаков разделителей. Решение не универсально, но вполне применимо в большинстве случаев. И если вы не хотите включать в зависимость тяжеловесные библиотеки с множеством лишних функций и сложной логикой, то это решение для вас.

<!-- more -->

Создание кастомного Form Control'а начинается с имплементации интерфейса `ControlValueAccessor`. 
`ControlValueAccessor` устанавливает связь между контролом и нативным элементом.

Который содержит в себе 4 описания функций: 
- `writeValue(obj: any): void;` - записывает новое значение в элемент
- `registerOnChange(fn: any): void;` - устанавливает функцию которая будет вызвана после того, как контрол получит change событие.
- `registerOnTouched(fn: any): void;` - устанавливает функцию которая вызывается после нажатия на контрол.
- `setDisabledState?(isDisabled: boolean): void;` - эта функция не обязательна к имплементации. Она вызывается когда контрол получает состояния **disabled**. В теле функции описывается поведение в зависимости от статуса.

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

далее разберем ее построчно.


`selectionEnd` имеет назначение получения/задания конечной позиции выделения, но в нашем случае это неплохой способ получить позицию курсора.
```ts
this._currentCursorPosition = this.mdInputEl.nativeElement.selectionEnd;
```

далее получаем шаблон для поля ввода, и делается это в соответствии с маской. Тут все просто, если элемент маски RegExp то ставим спец.символ шаблона, в ином случае ставим символ который в маске.


```ts
private _convertMaskToPlaceholder(): string {
    return this.mask.map((char) => {
        return (char instanceof RegExp) ? this._placeholderChar : char;
    }).join('');
}
```

Следующим шагом идет трансформация значениия полученного из поля ввода в два значения: певрвое - преобразованное значение в паттерном ввода, второе - чистое значение.

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

Далее устанавливаются полученые значения и позиция курсора.

```ts
this.mdInputEl.nativeElement.value = values.conformed;
this.mdInputEl.nativeElement.setSelectionRange(
    adjustedCursorPosition,
    adjustedCursorPosition,
    'none');

this._onChange(values.cleaned);

this._previousValue = values.conformed;
this._previousPlaceholder = placeholder;
```

Ну вот, теперь контрол маски ввода готов к использованию.
Задается она следующим образом:

```ts
 public cardMask = [/\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/, ' ', /\d/, /\d/, /\d/, /\d/];
```

И создаем форму с валидатором.

```ts
this.cardForm = this._formBuilder.group({
      card: ['', Validators.pattern(/^[0-9]{16}$/)]
    });

this.cardForm.controls.card.setValue('1234567890123456');
```

<img class="post-logo" src="https://blog.zverit.com/assets/card-mask-component.png" alt="Card mask Angular form control" /> 


<details> 
  <summary>Весь код</summary>

</details>

```ts
import {Component, ElementRef, forwardRef, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from "@angular/core";
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";

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
export class MaskedInputComponent implements ControlValueAccessor, OnInit {
    @ViewChild('mdInputEl') public mdInputEl: ElementRef;

    @Input() mask: any[];

    @Input() title: string;

    public mdInput = new FormControl();

    private _previousValue: string = '';

    private _previousPlaceholder: string = '';

    private _maxInputValue: number;

    private _currentCursorPosition: number;

    private readonly _placeholderChar: string = '_';

    public ngOnInit(): void {
        this._maxInputValue = this.mask.length;

        this.mdInput.valueChanges
            .subscribe((value: string) => {
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
                },
                (err) => console.warn(err)
            );
    }

    public writeValue(value: string): void {

        this._currentCursorPosition = this.mdInputEl.nativeElement.selectionEnd;

        if (value) {
            const placeholder = this._convertMaskToPlaceholder();
            let values = this._conformValue(value, placeholder);
            this.mdInputEl.nativeElement.value = values.conformed;
        }

        this.mdInput.setValue(value);
    }


    public registerOnChange(fn: any): void {
        this._onChange = fn;
    }

    public registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }

    private _onChange: Function = (_: any) => {
    }

    private _onTouched: Function = (_: any) => {
    }

    private _convertMaskToPlaceholder(): string {
        return this.mask.map((char) => {
            return (char instanceof RegExp) ? this._placeholderChar : char;
        }).join('');
    }


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
}
```
