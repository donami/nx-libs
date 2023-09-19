/* eslint-disable @typescript-eslint/no-empty-function */
import { ConversationPlatform } from './conversation-platform';

export class ConversationFormAdapter /*implements Adapter*/ {
  constructor(_platform: ConversationPlatform) {}

  submit =
    (
      _invoke: any /*InvokeAdapterDelegate*/,
      _cancel: any /*CancelAdapterDelegate*/
    ) =>
    async (_contactMethod: any): Promise<any> => {
      //
    };
  // this.platform.container
  //   .getAsync('data')
  //   .then((dataSource: any/* DataSource */) =>
  //     dataSource
  //       .read()
  //       .then((entries: any) => {
  //         const { entryId } = contactMethod;
  //         const entry = entries.find((e: any) => e.id === entryId);
  //         if (entry) {
  //           const { submit, validate } = this.platform.formHandlers[entry.content.key];

  //           const { values } = { values: {} }/*extractFormValues(contactMethod.body.form)*/;

  //           if (validate) {
  //             return validate(values)
  //               .then((result) => {
  //                 const { valid, errors } = result;
  //                 if (valid) {
  //                   return submit(values)
  //                     .then(() => {
  //                       this.updateContactMethod(contactMethod);
  //                       return {};
  //                     });
  //                 }
  //                 this.updateContactMethod(contactMethod, errors);
  //                 return {};
  //               });

  //           }
  //           return submit(values)
  //             .then(() => {
  //               this.updateContactMethod(contactMethod);
  //               return {};
  //             });
  //         }

  //         return {};
  //       }),
  // )

  updateContactMethod = (_contactMethod: any, _errors?: any) => {};
  // const { entryId, body: { form: initialForm } } = contactMethod;

  // const form = new FormBuilder(initialForm)
  //   .setValidationErrors(errors)
  //   .get();
  // form.layout['ui:disabled'] = errors ? undefined : 'true';
  // contactMethod.body.form = form;

  // this.platform.container
  //   .getManyAsync('data', 'writer')
  //   .then(({
  //     data,
  //     writer,
  //   }) => {
  //     const entry = data
  //       .getStream()
  //       .read()
  //       .find((e: any/*Entry*/) => e.id === entryId);

  //     if (entry) {
  //       if (entry.type === 'List') {
  //         const updatedItems = entry.content.items.map((item: any) => {
  //           if (item.id === contactMethod.id) {
  //             return contactMethod;
  //           }
  //           return item;
  //         });
  //         writer.update(entryId, { items: updatedItems });
  //         writer.commit();
  //       } else if (
  //         entry.type === 'ContactMethod' ||
  //         entry.type === 'Contact'
  //       ) {
  //         writer.update(contactMethod.entryId, contactMethod);
  //         writer.commit();
  //       }
  //     }
  //   });
  // }
}
