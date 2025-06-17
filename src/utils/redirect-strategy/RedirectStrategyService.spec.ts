import { RedirectStrategyService } from './RedirectStrategyService';
import { Response } from 'express';

describe('RedirectStrategyService', () => {
    let res: Partial<Response>;
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules();
        res = { redirect: jest.fn() };
    });

    describe('redirectWithConnectionResult', () => {
        it('redirects to integration-success on success', () => {
            const result = { success: true };
            RedirectStrategyService.redirectWithConnectionResult(res as Response, result);
            expect(res.redirect).toHaveBeenCalledWith(
                `${process.env.FRONT_END_URL}/integration-success?provider=github`
            );
        });

        it('redirects to integration-failure on error', () => {
            const result = { success: false, error: 'Oops!' };
            RedirectStrategyService.redirectWithConnectionResult(res as Response, result);
            expect(res.redirect).toHaveBeenCalledWith(
                `${process.env.FRONT_END_URL}/integration-failure?error=Oops!`
            );
        });
    });

    describe('redirectToSuccess', () => {
        it('redirects to login-success with token query', () => {
            const payload = { access_token: 'abc123' };
            RedirectStrategyService.redirectToSuccess(res as Response, payload);
            expect(res.redirect).toHaveBeenCalledWith(
                `${process.env.FRONT_END_URL}/login-success?token=abc123`
            );
        });
    });

    describe('redirectToFailure', () => {
        it('redirects to login-failure with default reason', () => {
            RedirectStrategyService.redirectToFailure(res as Response);
            expect(res.redirect).toHaveBeenCalledWith(
                `${process.env.FRONT_END_URL}/login-failure?reason=Authentication%20failed`
            );
        });

        it('redirects to login-failure with custom reason', () => {
            const reason = 'Bad creds';
            RedirectStrategyService.redirectToFailure(res as Response, reason);
            expect(res.redirect).toHaveBeenCalledWith(
                `${process.env.FRONT_END_URL}/login-failure?reason=${encodeURIComponent(reason)}`
            );
        });
    });
});
