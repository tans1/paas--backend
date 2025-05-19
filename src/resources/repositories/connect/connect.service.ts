import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  CallBackFailedException,
  TokenNotFoundException,
} from '@/utils/exceptions/github.exception';
import * as crypto from 'crypto';
import { UsersService } from '../../users/users.service';

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

type GitHubUser = {
  username: string;
  accessToken: number;
}
@Injectable()
export class ConnectService {
  constructor(private readonly usersService: UsersService) {}
  redirectToGitHubAuth(user) {
    const state = this.createState({ flow: 'connect', sub: user })
    const redirectUri =
      'https://github.com/login/oauth/authorize' +
      `?client_id=${process.env.GITHUB_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.GITHUB_CALLBACK_URL)}` +
      `&scope=repo,user:email`+
      `&state=${state}`;

    return redirectUri;
  }


  async handleGitHubCallback(state: string, githubUser: GitHubUser) {
    // 1) Verify and parse the state payload

    try{
      let payload: { flow: string; sub: any };
      try {
        payload = this.verifyState(state);
      } catch (err) {
        // If state is bad or tampered with
        throw new CallBackFailedException();
      }

      // 2) Make sure this is the “connect” flow
      if (payload.flow !== 'connect') {
        throw new CallBackFailedException();
      }

      // 3) Extract email (or user identifier) from the payload
      //    If you stored the entire user object under `sub`, adjust accordingly.
      const email = payload.sub.email;

      // 4) Destructure the GitHub user data
      const { username : userName, accessToken } = githubUser;

      if (!accessToken) {
        throw new TokenNotFoundException();
      }

      // 5) Update your user record
      await this.usersService.updateByEmail(email, {
        githubUsername:    userName,
        githubAccessToken: accessToken,
      });

      // 6) Return a friendly response
      return {
        success : true,
      };

    }
    catch(err){
        console.log(err)
        throw new HttpException(err.message,HttpStatus.BAD_REQUEST)
    }
    
  }

  // async handleGitHubCallback(state: string, githubUser : GithhubUser) {
  //   try {
  //     // interface GitHubTokenResponse {
  //     //   access_token: string;
  //     //   token_type: string;
  //     //   scope: string;
  //     // }

    
  //     // const tokenResponse = await axios.post<GitHubTokenResponse>(
  //     //   'https://github.com/login/oauth/access_token',
  //     //   {
  //     //     client_id: process.env.GITHUB_CLIENT_ID,
  //     //     client_secret: process.env.GITHUB_CLIENT_SECRET,
  //     //     code,
  //     //   },
  //     //   {
  //     //     headers: { Accept: 'application/json' },
  //     //   },
  //     // );

  //     // console.log(tokenResponse)

  //     // const accessToken = tokenResponse.data.access_token;
      

  //     // if (!accessToken) {
  //     //   throw new TokenNotFoundException();
  //     // }

     

  //     // const userInfo = await axios.get<GitHubUser>(
  //     //   'https://api.github.com/user',
  //     //   {
  //     //     headers: {
  //     //       Authorization: `token ${accessToken}`,
  //     //     },
  //     //   },
  //     // );

  //     // const githubUsername = userInfo.data.login;
  //     // console.log(githubUsername)
  //     let payload = this.verifyState(state);
  //     console.log(payload)
  //     const email = payload.sub.email
      
  //     // let email = userInfo.data.email;
  //     // if (!email) {
  //     //   const emailsResponse = await axios.get<GitHubEmail[]>(
  //     //     'https://api.github.com/user/emails',
  //     //     {
  //     //       headers: {
  //     //         Authorization: `token ${accessToken}`,
  //     //       },
  //     //     },
  //     //   );
  //       // Get the primary email (or the first verified email if none is marked primary)
  //       // const primaryEmail = emailsResponse.data.find(
  //       //   (e) => e.primary && e.verified,
  //       // );
  //       // email = primaryEmail
  //       //   ? primaryEmail.email
  //       //   : emailsResponse.data[0]?.email;
  //     // }
  //     // await this.githubRepository.create(githubUsername, accessToken);
  //     await this.usersService.updateByEmail(email, {
  //       githubUser.username,
  //       githubAccessToken: accessToken,
  //     });
  //     return {
  //       message: 'Successfully connected to GitHub',
  //       data: {
  //         githubUsername,
  //       },
  //     };
  //   } catch (error) {
  //     console.error(error);
  //     throw new CallBackFailedException();
  //   }
  // }


  createState(payload: object): string {
    const SECRET = process.env.STATE_SECRET;
    const json    = JSON.stringify(payload);
    const sig     = crypto.createHmac('sha256', SECRET).update(json).digest('hex');
    const b64     = Buffer.from(json).toString('base64');
    return `${b64}.${sig}`;
  }

  verifyState(state: string): any {
    const SECRET = process.env.STATE_SECRET;
    const [b64, sig] = state.split('.');
    const json       = Buffer.from(b64, 'base64').toString();
    const expected   = crypto.createHmac('sha256', SECRET).update(json).digest('hex');
    if (sig !== expected) throw new Error('Invalid state signature');
    return JSON.parse(json);
  }
}
