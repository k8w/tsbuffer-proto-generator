import path from "path";
import { ProtoGenerator } from '../../../src/ProtoGenerator';

describe('Remark', function () {
    it('preserveRemark', async function () {
        let generator = new ProtoGenerator({
            baseDir: path.resolve(__dirname, 'sources'),
            keepComment: true
        });

        await generator.generate('Remark.ts');
    })
})