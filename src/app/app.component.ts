import { Component } from '@angular/core';
import { PDFDocumentProxy } from 'ng2-pdf-viewer';
import { FormGroup, FormControl, FormBuilder } from '@angular/forms';
import { Input } from './input';
import {PDFDocument} from 'pdf-lib';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    // screen DPI / PDF DPI
    readonly dpiRatio = 96 / 72;

    public pdfSrc = './pdf-test.pdf';
    public pdfEx = './OoPdfFormExample.pdf';

    // private pdfDoc;

    public jsonURL = './sampleInput.json';
    public jsonData;

    public myForm: FormGroup;

    public inputList: Input[] = [];

    public zoom = 1;

    constructor(private _fb: FormBuilder) {
        this.myForm = this._fb.group({});
        // this.setupPDF();
     }// end constructor

    /*private async setupPDF() {
      const pdfMeta = await fetch(this.pdfSrc).then(res => res.arrayBuffer());
      let pages;
      this.pdfDoc = await PDFDocument.load(pdfMeta).then(res => pages = res.getPages());
      console.log(this.pdfDoc);
      console.log(pages[0]);
    }// end setupPDF*/

    private createInput(annotation: PDFAnnotationData, rect: number[] = null) {
        let formControl = new FormControl(annotation.buttonValue || '');
        const input = new Input();
        input.name = annotation.fieldName;

        if (annotation.fieldType === 'Tx') {
            input.type = 'text';
            input.value = annotation.fieldValue || '';
            formControl = new FormControl(input.value);
        }

        if (annotation.fieldType === 'Btn' && !annotation.checkBox) {
            input.type = 'radio';
            input.value = annotation.buttonValue;
        }

        if (annotation.checkBox) {
            input.type = 'checkbox';
            input.value = annotation.fieldValue === 'Yes' ? true : false;
            formControl = new FormControl(input.value || false);
        }

        if (annotation.fieldType === 'Ch') {
          input.type = 'text';
          input.value = annotation.fieldValue || '';
        }

        // Calculate all the positions and sizes
        if (rect) {
            input.top = rect[1] - (rect[1] - rect[3]);
            input.left = rect[0];
            input.height = (rect[1] - rect[3]) * .9;
            input.width = (rect[2] - rect[0]);
        }
        this.inputList.push(input);
        return formControl;
    }

    private addInput(annotation: PDFAnnotationData, rect: number[] = null): void {
        // add input to page
        this.myForm.addControl(annotation.fieldName, this.createInput(annotation, rect));
    }

    public getInputPosition(input: Input): any {
        return {
            top: `${input.top}px`,
            left: `${input.left}px`,
            height: `${input.height}px`,
            width: `${input.width}px`,
        };
    }

    public zoomIn(): void {
        this.inputList = this.inputList.map(i => {
            i.left *= (.25 / this.zoom) + 1;
            i.top *= (.25 / this.zoom) + 1;
            i.width *= (.25 / this.zoom) + 1;
            i.height *= (.25 / this.zoom) + 1;
            return i;
        });
        this.zoom += .25;
    }

    public zoomOut(): void {
        this.inputList = this.inputList.map(i => {
            i.left *= 1 - (.25 / this.zoom);
            i.top *= 1 - (.25 / this.zoom);
            i.width *= 1 - (.25 / this.zoom);
            i.height *= 1 - (.25 / this.zoom);
            return i;
        });
        this.zoom -= .25;
    }

    public loadComplete(pdf: PDFDocumentProxy): void {
        for (let i = 1; i <= pdf.numPages; i++) {
            // track the current page
            let currentPage = null;
            pdf.getPage(i).then(p => {
                currentPage = p;
                console.log(p);
                // get the annotations of the current page
                return p.getAnnotations();
            }).then(ann => {

                // ugly cast due to missing typescript definitions
                // please contribute to complete @types/pdfjs-dist
                const annotations = (<any>ann) as PDFAnnotationData[];
                console.log(annotations);
                annotations
                    .filter(a => a.subtype === 'Widget') // get the form field annotation only
                    .forEach(a => {

                        // get the rectangle that represent the single field
                        // and resize it according to the current DPI
                        const fieldRect = currentPage.getViewport(this.dpiRatio)
                            .convertToViewportRectangle(a.rect);

                        // add the corresponding input
                        this.addInput(a, fieldRect);
                    });
            });
        }
        console.log(this.myForm);
        console.log(this.inputList);
    }// end loadComplete

    public logJSON() {
        console.log(this.myForm.value);
        // console.log(this.pdfDoc);
    }

    public saveToPDF() {
      console.log('saving to pdf');
      this.myForm.setValue({name: this.inputList[0].value,
                                  surname: this.inputList[1].value,
                                  email: this.inputList[2].value,
                                  gender: '',
                                  angular: this.inputList[5].value, react: this.inputList[6].value, vue: this.inputList[7].value});
    }// end saveToPDF

}// end AppComponent
