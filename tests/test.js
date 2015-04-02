describe("Checking parameters", function() {

    it ("existence", function() {
        expect(app.issetParameter('mode')).toBe(true);
        expect(app.issetParameter('foo')).toBe(true);
        expect(app.issetParameter('bar')).toBe(true);
        expect(app.issetParameter('param1')).toBe(true);
        expect(app.issetParameter('param2')).toBe(true);
        expect(app.issetParameter('param3')).toBe(true);
    });

    it ("values", function() {
        expect(app.getParameter('mode')).toBe('dev');
        expect(app.getParameter('foo')).toBe(true);
        expect(app.getParameter('bar')).toBe(10);
        expect(app.getParameter('param1')).toBe(10);
        expect(app.getParameter('param2')).toBe(20);
        expect(app.getParameter('param3')).toBe(35);
    });

    it ("not allowed actions", function() {
        expect(function() { app.setParameter('failParam', 20) }).toThrow();
    });
});