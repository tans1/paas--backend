import { DeploymentEventsGateway } from './deployment-events.gateway';
import { Socket } from 'socket.io';
import { NewDeployment, DeploymentUpdate } from './dto/deployment.event.dto';

describe('DeploymentEventsGateway', () => {
    let gateway: DeploymentEventsGateway;
    let fakeSocket: Partial<Socket>;

    beforeEach(() => {
        gateway = new DeploymentEventsGateway();
        fakeSocket = {
            id: 'socket1',
            handshake: {
                query: {
                    repositoryId: '123',
                    branch: 'feat-branch',
                },
                headers: undefined,
                time: '',
                address: '',
                xdomain: false,
                secure: false,
                issued: 0,
                url: '',
                auth: {}
            },
            emit: jest.fn(),
        };
    });

    it('should add socket on connection', () => {
        gateway.handleConnection(fakeSocket as Socket);

        const key = '123:feat-branch';
        // @ts-ignore access private map
        expect(gateway['deployments'].get(key)).toBe(fakeSocket);
    });

    it('should remove socket on disconnect', () => {
        gateway.handleConnection(fakeSocket as Socket);
        const key = '123:feat-branch';

        // now disconnect
        gateway.handleDisconnect(fakeSocket as Socket);
        // @ts-ignore
        expect(gateway['deployments'].has(key)).toBe(false);
    });

    it('should emit newDeployment event to the right socket', () => {
        gateway.handleConnection(fakeSocket as Socket);
        const event: NewDeployment = { deploymentId: 42, branch: 'feat-branch', timestamp: 'ts' };

        gateway.sendNewDeploymentEvent(123, 'feat-branch', event);

        expect(fakeSocket.emit).toHaveBeenCalledWith('newDeployment', event);
    });

    it('should emit deploymentUpdate event to the right socket', () => {
        gateway.handleConnection(fakeSocket as Socket);
        const event: DeploymentUpdate = { deploymentId: 42, status: 'deployed', timestamp: 'ts' };

        gateway.sendDeploymentUpdateEvent(123, 'feat-branch', event);

        expect(fakeSocket.emit).toHaveBeenCalledWith('deploymentUpdate', event);
    });

    it('should do nothing when sending to non-existent key', () => {
        // No connection registered
        const event: NewDeployment = { deploymentId: 1, branch: 'b', timestamp: 't' };
        // Should not throw
        expect(() => gateway.sendNewDeploymentEvent(999, 'no-branch', event)).not.toThrow();
        expect(fakeSocket.emit).not.toHaveBeenCalled();
    });
});
