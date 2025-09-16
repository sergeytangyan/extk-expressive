import assert from 'node:assert';
import { describe, it } from 'node:test';
import { slugify } from '../../src/common';
import { chance } from '../fixes/chance';


describe('slugify', () => {
    it('should replace spaces with dashes', () => {
        const input = 'sdfhjk sdfjhs kfhjsd';

        const result = slugify(input);

        assert.equal(result, 'sdfhjk-sdfjhs-kfhjsd');
    });

    it('should replace new lines with dashes', () => {
        const input = 'sdfhjk sdfjhs\nkfhjsd';

        // console.log({ input });
        const result = slugify(input);

        assert.equal(result, 'sdfhjk-sdfjhs-kfhjsd');
    });

    it('should convert to lower case', () => {
        const input = chance.string({ casing: 'upper' });

        const result = slugify(input);

        assert(result, input.toLowerCase());
    });
});
