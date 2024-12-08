import Logger from 'src/utils/logger';

describe('Logger', () => {
    it('should throw an error if Logger class is instantiated', () => {
        expect(() => {
            new Logger();
        }).toThrowError('This class cannot be instantiated.');
    });
});
